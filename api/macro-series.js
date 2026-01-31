const SYMBOL_MAP = {
  USDTRY: { base: 'USD', symbols: 'TRY' },
  EURTRY: { base: 'EUR', symbols: 'TRY' },
};

const buildRange = (days) => {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    startStr: start.toISOString().split('T')[0],
    endStr: end.toISOString().split('T')[0],
  };
};

const fetchFromExchangeRateHost = async (config, startStr, endStr) => {
  const url = new URL('https://api.exchangerate.host/timeseries');
  url.searchParams.append('start_date', startStr);
  url.searchParams.append('end_date', endStr);
  url.searchParams.append('base', config.base);
  url.searchParams.append('symbols', config.symbols);
  if (process.env.EXCHANGE_RATE_HOST_KEY) {
    url.searchParams.append('access_key', process.env.EXCHANGE_RATE_HOST_KEY);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Macro source failed: ${response.status}`);
  }
  const payload = await response.json();
  const rates = payload?.rates || {};
  return Object.keys(rates)
    .sort()
    .map((date) => ({
      date,
      value: Number(rates[date][config.symbols]) || 0,
    }))
    .filter((point) => point.value > 0);
};

const fetchFromFrankfurter = async (config, startStr, endStr) => {
  const url = new URL(`https://api.frankfurter.dev/${startStr}..${endStr}`);
  url.searchParams.append('from', config.base);
  url.searchParams.append('to', config.symbols);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Frankfurter source failed: ${response.status}`);
  }
  const payload = await response.json();
  const rates = payload?.rates || {};
  return Object.keys(rates)
    .sort()
    .map((date) => ({
      date,
      value: Number(rates[date][config.symbols]) || 0,
    }))
    .filter((point) => point.value > 0);
};

module.exports = async function handler(req, res) {
  try {
    const symbol = (req.query.symbol || 'USDTRY').toString().toUpperCase();
    const days = Math.min(Number(req.query.days) || 365, 365 * 2);
    const config = SYMBOL_MAP[symbol];
    if (!config) {
      return res.status(400).json({ error: 'Unsupported symbol' });
    }

    const { startStr, endStr } = buildRange(days);
    let series = await fetchFromExchangeRateHost(config, startStr, endStr);
    let source = 'exchangerate.host';
    if (!series.length) {
      series = await fetchFromFrankfurter(config, startStr, endStr);
      source = 'frankfurter.app';
    }

    return res.status(200).json({
      symbol,
      range: { start: startStr, end: endStr },
      series,
      source,
    });
  } catch (error) {
    console.error('[macro-series] failed', error);
    return res.status(500).json({ error: 'Failed to load macro series', detail: error.message });
  }
};
