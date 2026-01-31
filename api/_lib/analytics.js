const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateDailyReturns = (points) => {
  if (!Array.isArray(points) || points.length < 2) return [];
  const returns = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1].value;
    const current = points[i].value;
    if (typeof prev !== 'number' || typeof current !== 'number' || prev <= 0) continue;
    returns.push((current - prev) / prev);
  }
  return returns;
};

const mean = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stddev = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
};

const calculateSharpeRatio = (points, riskFreeRate = 0) => {
  const returns = calculateDailyReturns(points);
  if (returns.length < 2) return null;
  const dailyExcess = returns.map((value) => value - riskFreeRate / 252);
  const avg = mean(dailyExcess);
  const deviation = stddev(dailyExcess);
  if (deviation === 0) return null;
  return (avg / deviation) * Math.sqrt(252);
};

const calculateVolatility = (points) => {
  const returns = calculateDailyReturns(points);
  if (returns.length < 2) return null;
  const deviation = stddev(returns);
  if (deviation === 0) return null;
  return deviation * Math.sqrt(252);
};

const calculateMaxDrawdown = (points) => {
  if (!Array.isArray(points) || points.length < 2) return null;
  let peak = points[0].value;
  let maxDrawdown = 0;
  if (typeof peak !== 'number' || peak <= 0) return null;
  for (let i = 1; i < points.length; i += 1) {
    const current = points[i].value;
    if (typeof current !== 'number' || current <= 0) continue;
    if (current > peak) {
      peak = current;
    }
    const drawdown = (peak - current) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
};

const calculateSma = (points, period) => {
  if (!Array.isArray(points) || points.length < period || period <= 0) return [];
  const result = [];
  let windowSum = 0;
  for (let i = 0; i < points.length; i += 1) {
    windowSum += points[i].value;
    if (i >= period) {
      windowSum -= points[i - period].value;
    }
    if (i >= period - 1) {
      result.push({ date: points[i].date, value: windowSum / period });
    }
  }
  return result;
};

const calculateRsi = (points, period = 14) => {
  if (!Array.isArray(points) || points.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = points[i].value - points[i - 1].value;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < points.length; i += 1) {
    const diff = points[i].value - points[i - 1].value;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return clamp(100 - 100 / (1 + rs), 0, 100);
};

const pickValueAtOrBefore = (points, targetDate) => {
  const target = new Date(targetDate).getTime();
  if (!Array.isArray(points) || Number.isNaN(target)) return null;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const current = new Date(points[i].date).getTime();
    if (!Number.isNaN(current) && current <= target) {
      return points[i].value;
    }
  }
  return null;
};

const calculateReturn = (points, days) => {
  if (!Array.isArray(points) || points.length === 0) return null;
  const latest = points[points.length - 1];
  const target = new Date(latest.date);
  target.setDate(target.getDate() - days);
  const baseValue = pickValueAtOrBefore(points, target.toISOString());
  if (baseValue === null || baseValue <= 0) return null;
  return (latest.value - baseValue) / baseValue;
};

module.exports = {
  calculateDailyReturns,
  calculateSharpeRatio,
  calculateVolatility,
  calculateMaxDrawdown,
  calculateSma,
  calculateRsi,
  calculateReturn,
};
