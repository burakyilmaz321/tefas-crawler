const supabase = require('./supabase');

const fetchFundHistory = async (code, startDate, endDate) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('historical_data')
    .select('date, price')
    .eq('fund_code', code)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    date: row.date,
    value: Number(row.price) || 0,
  }));
};

const fetchFundHistoryBatch = async (codes, startDate, endDate) => {
  if (!supabase || !Array.isArray(codes) || codes.length === 0) return {};

  const { data, error } = await supabase
    .from('historical_data')
    .select('fund_code, date, price')
    .in('fund_code', codes)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('fund_code', { ascending: true })
    .order('date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = {};
  for (const row of data || []) {
    const code = row.fund_code;
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push({
      date: row.date,
      value: Number(row.price) || 0,
    });
  }

  return grouped;
};

const fetchLatestPrice = async (code) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('historical_data')
    .select('date, price')
    .eq('fund_code', code)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return {
    date: data.date,
    value: Number(data.price) || 0,
  };
};

module.exports = {
  fetchFundHistory,
  fetchFundHistoryBatch,
  fetchLatestPrice,
};
