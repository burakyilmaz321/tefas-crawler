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
  fetchLatestPrice,
};
