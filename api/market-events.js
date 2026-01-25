const events = require('./_lib/market-events.json');

module.exports = async function handler(req, res) {
  try {
    const type = (req.query.type || '').toString().toUpperCase();
    const filtered = events.events.filter((event) => {
      if (!type) return true;
      return event.type.toUpperCase() === type;
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
