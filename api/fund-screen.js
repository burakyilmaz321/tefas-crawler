const supabase = require('./_lib/supabase');
const { fetchFundHistory } = require('./_lib/history');
const {
  calculateSharpeRatio,
  calculateVolatility,
  calculateMaxDrawdown,
  calculateReturn,
} = require('./_lib/analytics');

const getDateOffset = (days) => {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

module.exports = async function handler(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const kind = (req.query.kind || 'YAT').toString().toUpperCase();
    const minReturn1y = parseNumber(req.query.minReturn1y);
    const minReturn1m = parseNumber(req.query.minReturn1m);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { start, end } = getDateOffset(365);

    const { data: funds, error } = await supabase
      .from('funds')
      .select('code,title,kind')
      .eq('kind', kind)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const results = [];
    for (const fund of funds || []) {
      const history = await fetchFundHistory(fund.code, start, end);
      if (history.length < 10) continue;

      const return1m = calculateReturn(history, 30);
      const return1y = calculateReturn(history, 365);
      const sharpe = calculateSharpeRatio(history);
      const volatility = calculateVolatility(history);
      const maxDrawdown = calculateMaxDrawdown(history);

      if (minReturn1y !== null && (return1y === null || return1y * 100 < minReturn1y)) continue;
      if (minReturn1m !== null && (return1m === null || return1m * 100 < minReturn1m)) continue;

      results.push({
        code: fund.code,
        title: fund.title,
        kind: fund.kind,
        return1m,
        return1y,
        sharpe,
        volatility,
        maxDrawdown,
      });
    }

    results.sort((a, b) => (b.return1y || 0) - (a.return1y || 0));

    return res.status(200).json({
      kind,
      range: { start, end },
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[fund-screen] failed', error);
    return res.status(500).json({ error: 'Failed to load fund screen', detail: error.message });
  }
};
