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

module.exports = async function handler(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }
    const code = (req.query.code || '').toString().trim().toUpperCase();
    const days = Number(req.query.days) || 365;
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    const { start, end } = getDateOffset(days);
    const history = await fetchFundHistory(code, start, end);
    if (history.length === 0) {
      return res.status(404).json({ error: 'Fund history not found' });
    }

    const metrics = {
      sharpe: calculateSharpeRatio(history),
      volatility: calculateVolatility(history),
      maxDrawdown: calculateMaxDrawdown(history),
      return1m: calculateReturn(history, 30),
      return3m: calculateReturn(history, 90),
      return1y: calculateReturn(history, 365),
    };

    return res.status(200).json({
      code,
      range: { start, end },
      metrics,
    });
  } catch (error) {
    console.error('[fund-risk] failed', error);
    return res.status(500).json({ error: 'Failed to load fund risk', detail: error.message });
  }
};
