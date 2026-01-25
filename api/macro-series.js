const SYMBOL_MAP = {
  USDTRY: { base: 'USD', symbols: 'TRY' },
  EURTRY: { base: 'EUR', symbols: 'TRY' },
};

module.exports = async function handler(req, res) {
  try {
    const symbol = (req.query.symbol || 'USDTRY').toString().toUpperCase();
    const days = Math.min(Number(req.query.days) || 365, 365 * 2);
    const config = SYMBOL_MAP[symbol];
    if (!config) {
      return res.status(400).json({ error: 'Unsupported symbol' });
    }

    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const url = new URL('https://api.exchangerate.host/timeseries');
    url.searchParams.append('start_date', startStr);
    url.searchParams.append('end_date', endStr);
    url.searchParams.append('base', config.base);
    url.searchParams.append('symbols', config.symbols);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Macro source failed: ${response.status}`);
    }
    const payload = await response.json();
    const rates = payload?.rates || {};
    const series = Object.keys(rates)
      .sort()
      .map((date) => ({
        date,
        value: Number(rates[date][config.symbols]) || 0,
      }))
      .filter((point) => point.value > 0);

    return res.status(200).json({
      symbol,
      range: { start: startStr, end: endStr },
      series,
    });
  } catch (error) {
    console.error('[macro-series] failed', error);
    return res.status(500).json({ error: 'Failed to load macro series', detail: error.message });
  }
};
