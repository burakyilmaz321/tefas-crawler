const { bootstrapSession, fetchAllocation, fetchInfo, formatDate, toISO } = require('./_lib/tefas');
const supabase = require('./_lib/supabase');

const FIVE_YEARS_IN_DAYS = 365 * 5;

const buildHistoricalSeries = (rows, field) =>
  rows
    .filter((row) => row[field] !== undefined && row[field] !== null)
    .sort((a, b) => Number(a.TARIH) - Number(b.TARIH))
    .map((row) => ({
      date: toISO(row.TARIH),
      value: Number(row[field]) || 0,
    }));

const buildAllocation = (row = {}) => {
  const mapping = [
    ['stock', 'HS', 'Stocks'],
    ['government_bond', 'DT', 'Government Bonds'],
    ['precious_metals', 'KM', 'Precious Metals'],
    ['term_deposit', 'VM', 'Term Deposits'],
    ['repo', 'R', 'Repo'],
    ['participation_account', 'KH', 'Participation Accounts'],
  ];

  return mapping
    .map(([_, key, label]) => ({ label, value: Number(row[key]) || 0 }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
};

module.exports = async function handler(req, res) {
  try {
    const code = (req.query.code || '').toString().trim().toUpperCase();
    const kind = (req.query.kind || 'YAT').toString().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    const days = Number(req.query.days) || FIVE_YEARS_IN_DAYS;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const cookie = await bootstrapSession();

    // Chunk the request into 90-day intervals to avoid TEFAS 400 error
    const calculateChunks = (start, end) => {
      const chunks = [];
      let currentEnd = new Date(end);
      while (currentEnd > start) {
        let currentStart = new Date(currentEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (currentStart < start) currentStart = new Date(start);
        chunks.push({ start: formatDate(currentStart), end: formatDate(currentEnd) });
        currentEnd = new Date(currentStart.getTime() - 1 * 24 * 60 * 60 * 1000); // Subtract 1 day for next chunk
      }
      return chunks.reverse();
    };

    // Allocation is stable, just fetch from the last 30 days of the range to avoid 400
    const allocRange = { start: formatDate(new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)), end: formatDate(endDate) };

    // 1. Try fetching from Supabase first
    let cachedData = [];
    let fundTitle = '';

    if (supabase) {
      // Fetch fund metadata to get title
      const { data: fundData } = await supabase
        .from('funds')
        .select('title')
        .eq('code', code)
        .single();

      if (fundData) {
        fundTitle = fundData.title;
      }

      const { data, error } = await supabase
        .from('historical_data')
        .select('*')
        .eq('fund_code', code)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!error && data) {
        cachedData = data.map(d => ({
          TARIH: new Date(d.date).getTime().toString(),
          FIYAT: d.price,
          PORTFOYBUYUKLUK: d.market_cap,
          KISISAYISI: d.investor_count,
          FONUNVAN: fundTitle
        }));
        console.log(`[Cache] Found ${cachedData.length} records in Supabase for ${code}`);
      }
    }

    // 2. Check if cache covers the FULL requested range
    const firstCachedDate = cachedData.length ? new Date(Number(cachedData[0].TARIH)) : null;
    const lastCachedDate = cachedData.length ? new Date(Number(cachedData[cachedData.length - 1].TARIH)) : null;

    // Calculate expected number of trading days (~260 per year, ~5 per week)
    const expectedDays = Math.floor(days * (5 / 7) * 0.95); // Rough estimate of trading days
    const hasEnoughData = cachedData.length >= expectedDays * 0.8; // Allow 20% tolerance
    const coversFullRange = firstCachedDate && (firstCachedDate.getTime() - startDate.getTime() < 7 * 24 * 60 * 60 * 1000); // Within 1 week of start
    const isFresh = lastCachedDate && (new Date().getTime() - lastCachedDate.getTime() < 2 * 24 * 60 * 60 * 1000); // Within 2 days

    const cacheIsValid = hasEnoughData && coversFullRange && isFresh;
    console.log(`[Cache] ${code}: hasEnoughData=${hasEnoughData}, coversFullRange=${coversFullRange}, isFresh=${isFresh}, cacheIsValid=${cacheIsValid}`);

    let info = [];
    if (!cacheIsValid) {
      console.log(`[Cache] Cache incomplete for ${code}. Fetching from TEFAS...`);
      const chunks = calculateChunks(startDate, endDate);
      const allInfoResults = [];
      for (const chunk of chunks) {
        try {
          const chunkData = await fetchInfo({ ...chunk, code, kind, cookie });
          allInfoResults.push(...chunkData);
        } catch (err) {
          console.error(`[TEFAS] Failed to fetch chunk for ${code}:`, err.message);
        }
      }

      // Merge with cache and deduplicate (prefer TEFAS data as it has FONUNVAN)
      const infoMap = new Map();
      cachedData.forEach(item => infoMap.set(item.TARIH, item));
      // Merge with existing cache
      const existingDates = new Set(cachedData.map(d => d.TARIH));
      const newData = allInfoResults.filter(d => !existingDates.has(d.TARIH));
      info = [...cachedData, ...newData].sort((a, b) => Number(a.TARIH) - Number(b.TARIH));

      // Update fundTitle from fetched data if not set
      if (!fundTitle && info.length > 0) {
        fundTitle = info[0].FONUNVAN;
      }

      // 3. Sync ALL data back to Supabase (including fund metadata)
      if (supabase && info.length > 0) {
        // Sync fund metadata
        const { error: fundError } = await supabase.from('funds').upsert({
          code,
          title: fundTitle || info[0].FONUNVAN,
          kind,
          latest_date: toISO(info[info.length - 1].TARIH),
          updated_at: new Date().toISOString()
        }, { onConflict: 'code' });

        if (fundError) console.error('[Supabase] Failed to sync fund metadata:', fundError);

        const toUpsert = info.map(item => ({
          fund_code: code,
          date: new Date(Number(item.TARIH)).toISOString().split('T')[0],
          price: Number(item.FIYAT) || 0,
          market_cap: Number(item.PORTFOYBUYUKLUK) || 0,
          investor_count: Number(item.KISISAYISI) || 0
        }));

        const { error: upsertError } = await supabase.from('historical_data').upsert(toUpsert, { onConflict: 'fund_code,date' });
        if (upsertError) console.error('[Supabase] Failed to sync history:', upsertError);
        else console.log(`[Supabase] Synced ${toUpsert.length} records for ${code}`);
      }
    } else {
      console.log(`[Cache] Using cached data for ${code} (${cachedData.length} records)`);
      info = cachedData;
    }

    // Fetch allocation (usually doesn't need heavy caching as it's a single recent request)
    // Wrap in try-catch so allocation failure doesn't fail the entire request
    let allocation = [];
    try {
      allocation = await fetchAllocation({ ...allocRange, code, kind, cookie });
    } catch (err) {
      console.error(`[TEFAS] Failed to fetch allocation for ${code}:`, err.message);
      // Continue with empty allocation - fund data is still valid
    }

    if (!info.length) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    const priceHistory = buildHistoricalSeries(info, 'FIYAT');
    const marketCapHistory = buildHistoricalSeries(info, 'PORTFOYBUYUKLUK');
    const investorHistory = buildHistoricalSeries(info, 'KISISAYISI');
    const latest = info[info.length - 1]; // Already sorted by TARIH
    const lastAllocation = allocation.reduce(
      (acc, curr) => (Number(curr.TARIH) > Number(acc.TARIH) ? curr : acc),
      allocation[0] || {},
    );

    const fund = {
      code,
      title: latest.FONUNVAN,
      kind,
      priceHistory,
      marketCapHistory,
      investorHistory,
      allocation: buildAllocation(lastAllocation),
      latestPrice: Number(latest.FIYAT) || 0,
      latestDate: toISO(latest.TARIH),
    };

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({ fund });
  } catch (error) {
    console.error('[fund-history] failed', error);
    return res.status(500).json({ error: 'Failed to load fund', detail: error.message });
  }
};
