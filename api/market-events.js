const localEvents = require('./_lib/market-events.json');

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const normalizeImpact = (value) => {
  if (!value) return 'medium';
  const text = String(value).toLowerCase();
  if (text.includes('high')) return 'high';
  if (text.includes('low')) return 'low';
  return 'medium';
};

const fetchTradingEconomics = async () => {
  const apiKey = process.env.TRADING_ECONOMICS_KEY;
  if (!apiKey) return null;

  const url = new URL('https://api.tradingeconomics.com/calendar');
  url.searchParams.append('c', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TradingEconomics failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload)) return null;

  return payload.map((event) => {
    const dateStr = event.Date ? String(event.Date).slice(0, 10) : '';
    return {
      date: dateStr,
      type: event.Country || event.Category || 'GLOBAL',
      title: event.Event || event.Category || 'Ekonomik Takvim',
      impact: normalizeImpact(event.Importance || event.Impact),
      note: event.Reference || event.Actual || '',
    };
  });
};

module.exports = async function handler(req, res) {
  try {
    const type = (req.query.type || '').toString().toUpperCase();
    const start = parseDate(req.query.start);
    const end = parseDate(req.query.end);

    let events = localEvents.events || [];
    try {
      const external = await fetchTradingEconomics();
      if (external && external.length > 0) {
        events = external;
      }
    } catch (error) {
      console.warn('[market-events] external source failed', error.message);
    }

    const filtered = events.filter((event) => {
      if (!type) return true;
      return event.type.toUpperCase() === type;
    }).filter((event) => {
      if (!start && !end) return true;
      const time = parseDate(event.date);
      if (!time) return false;
      if (start && time < start) return false;
      if (end && time > end) return false;
      return true;
    });

    return res.status(200).json({
      count: filtered.length,
      events: filtered,
    });
  } catch (error) {
    console.error('[market-events] failed', error);
    return res.status(500).json({ error: 'Failed to load events', detail: error.message });
  }
};
