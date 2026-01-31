const supabase = require('./_lib/supabase');
const { fetchFundHistoryBatch } = require('./_lib/history');
const { calculateRsi, calculateSma } = require('./_lib/analytics');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const getDateOffset = (days) => {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

const detectSmaCross = (shortSma, longSma) => {
  if (shortSma.length < 2 || longSma.length < 2) return false;
  const shortPrev = shortSma[shortSma.length - 2].value;
  const shortNow = shortSma[shortSma.length - 1].value;
  const longPrev = longSma[longSma.length - 2].value;
  const longNow = longSma[longSma.length - 1].value;
  return shortPrev < longPrev && shortNow > longNow;
};

module.exports = async function handler(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const kind = (req.query.kind || 'YAT').toString().toUpperCase();
    const rsiBelow = Number(req.query.rsiBelow) || 30;
    const shortPeriod = Number(req.query.shortPeriod) || 20;
    const longPeriod = Number(req.query.longPeriod) || 50;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { start, end } = getDateOffset(365);
    const cacheKey = JSON.stringify({ kind, rsiBelow, shortPeriod, longPeriod, limit, start, end });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return res.status(200).json(cached.data);
    }

    const { data: funds, error } = await supabase
      .from('funds')
      .select('code,title,kind')
      .eq('kind', kind)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const codes = (funds || []).map((fund) => fund.code);
    const historyByCode = await fetchFundHistoryBatch(codes, start, end);

    const results = [];
    for (const fund of funds || []) {
      const history = historyByCode[fund.code] || [];
      if (history.length < longPeriod + 2) continue;

      const rsi = calculateRsi(history, 14);
      const shortSma = calculateSma(history, shortPeriod);
      const longSma = calculateSma(history, longPeriod);
      const hasCross = detectSmaCross(shortSma, longSma);

      if ((rsi !== null && rsi <= rsiBelow) || hasCross) {
        results.push({
          code: fund.code,
          title: fund.title,
          kind: fund.kind,
          rsi,
          shortSma: shortSma[shortSma.length - 1]?.value || null,
          longSma: longSma[longSma.length - 1]?.value || null,
          smaCross: hasCross,
        });
      }
    }

    const payload = {
      kind,
      range: { start, end },
      count: results.length,
      results,
    };
    cache.set(cacheKey, { at: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[fund-technical-scan] failed', error);
    return res.status(500).json({ error: 'Failed to scan funds', detail: error.message });
  }
};
