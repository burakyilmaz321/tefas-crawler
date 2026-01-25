const supabase = require('./_lib/supabase');
const { fetchLatestPrice } = require('./_lib/history');

module.exports = async function handler(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { holdings = [] } = req.body || {};
    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ error: 'Holdings must be a non-empty array' });
    }

    const enriched = [];
    let totalValue = 0;
    let totalCost = 0;

    for (const holding of holdings) {
      const code = (holding.code || '').toString().trim().toUpperCase();
      const shares = Number(holding.shares);
      const cost = Number(holding.cost) || 0;
      if (!code || !Number.isFinite(shares) || shares <= 0) continue;

      const latest = await fetchLatestPrice(code);
      const price = latest ? latest.value : 0;
      const value = price * shares;
      totalValue += value;
      totalCost += cost * shares;

      enriched.push({
        code,
        shares,
        cost,
        latestPrice: price,
        latestDate: latest?.date || null,
        value,
        pnl: value - cost * shares,
      });
    }

    const holdingsWithWeights = enriched.map((holding) => ({
      ...holding,
      weight: totalValue > 0 ? holding.value / totalValue : 0,
    }));

    return res.status(200).json({
      totalValue,
      totalCost,
      pnl: totalValue - totalCost,
      pnlPct: totalCost > 0 ? (totalValue - totalCost) / totalCost : null,
      holdings: holdingsWithWeights,
    });
  } catch (error) {
    console.error('[portfolio-valuation] failed', error);
    return res.status(500).json({ error: 'Failed to value portfolio', detail: error.message });
  }
};
