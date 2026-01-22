const { bootstrapSession, fetchInfo, formatDate, toISO } = require('./_lib/tefas');
const supabase = require('./_lib/supabase');
const nonTefasFunds = require('./_lib/nonTefasFunds.json');

const nonTefasSet = new Set(nonTefasFunds.funds.map(code => code.toUpperCase()));

const uniqueByCode = (rows) => {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.FONKODU) return false;
    const code = row.FONKODU.toUpperCase();
    if (seen.has(code)) return false;
    seen.add(code);
    return true;
  });
};

module.exports = async function handler(req, res) {
  try {
    const kind = (req.query.kind || 'YAT').toString().toUpperCase();
    const today = new Date();
    const formatted = formatDate(today);
    const cookie = await bootstrapSession();
    const info = await fetchInfo({ start: formatted, end: formatted, kind, cookie });
    const funds = uniqueByCode(info).map((entry) => {
      const code = entry.FONKODU?.toUpperCase();
      const fund = {
        code,
        title: entry.FONUNVAN,
        kind,
        latestDate: toISO(entry.TARIH),
      };
      // Add TEFAS availability flag for YAT funds
      if (kind === 'YAT') {
        fund.isTefasAvailable = !nonTefasSet.has(code);
      }
      return fund;
    });

    if (supabase && funds.length > 0) {
      const toUpsert = funds.map(f => ({
        code: f.code,
        title: f.title,
        kind: f.kind,
        latest_date: f.latestDate.split('T')[0],
        updated_at: new Date().toISOString()
      }));
      await supabase.from('funds').upsert(toUpsert, { onConflict: 'code' });
      console.log(`[Supabase] Synced ${funds.length} funds for kind ${kind}`);
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ funds, asOf: toISO(today) });
  } catch (error) {
    console.error('[funds] failed', error);
    return res.status(500).json({ error: 'Failed to load funds', detail: error.message });
  }
};
