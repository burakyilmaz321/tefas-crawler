const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateDailyReturns,
  calculateSharpeRatio,
  calculateVolatility,
  calculateMaxDrawdown,
  calculateSma,
  calculateRsi,
  calculateReturn,
} = require('../../api/_lib/analytics');

const points = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-02', value: 102 },
  { date: '2024-01-03', value: 101 },
  { date: '2024-01-04', value: 105 },
  { date: '2024-01-05', value: 110 },
];

test('calculateDailyReturns returns expected length', () => {
  const returns = calculateDailyReturns(points);
  assert.equal(returns.length, 4);
});

test('calculateSharpeRatio returns a number for valid history', () => {
  const sharpe = calculateSharpeRatio(points);
  assert.equal(typeof sharpe, 'number');
});

test('calculateVolatility returns a number for valid history', () => {
  const vol = calculateVolatility(points);
  assert.equal(typeof vol, 'number');
});

test('calculateMaxDrawdown detects drawdown', () => {
  const drawdown = calculateMaxDrawdown(points);
  assert.ok(drawdown >= 0);
});

test('calculateSma returns expected size', () => {
  const sma = calculateSma(points, 3);
  assert.equal(sma.length, 3);
  assert.equal(sma[0].value.toFixed(2), '101.00');
});

test('calculateRsi returns a bounded value', () => {
  const rsi = calculateRsi([...points, { date: '2024-01-06', value: 108 }, { date: '2024-01-07', value: 112 }], 3);
  assert.ok(rsi >= 0 && rsi <= 100);
});

test('calculateReturn returns percentage over days', () => {
  const value = calculateReturn(points, 2);
  assert.ok(value !== null);
});
