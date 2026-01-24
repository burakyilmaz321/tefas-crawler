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
    // Use a date 2 days ago to ensure TEFAS has data (system date may be incorrect)
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const formatted = formatDate(twoDaysAgo);
    console.log(`[funds] Fetching funds for ${kind} on date: ${formatted}`);
    const cookie = await bootstrapSession();
    const info = await fetchInfo({ start: formatted, end: formatted, kind, cookie });
    console.log(`[funds] Received ${info.length} fund records from TEFAS`);
    const funds = uniqueByCode(info).map((entry) => ({
      code: entry.FONKODU?.toUpperCase(),
      title: entry.FONUNVAN,
      kind,
      latestDate: toISO(entry.TARIH),
    }));

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
