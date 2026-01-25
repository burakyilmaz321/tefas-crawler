import { useEffect, useMemo, useState } from 'react';
import { fetchFundDetails, fetchFunds } from '../api';
import { FundKind, FundOverview, FundSummary, HistoricalPoint } from '../types';
import PerformanceChart from '../components/PerformanceChart';

const BenchmarkPage = () => {
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [baseCode, setBaseCode] = useState('');
  const [benchmarkCode, setBenchmarkCode] = useState('');
  const [baseFund, setBaseFund] = useState<FundOverview | null>(null);
  const [benchmarkFund, setBenchmarkFund] = useState<FundOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFunds = async () => {
      try {
        const data = await fetchFunds('BYF');
        setFunds(data);
        if (data.length >= 2) {
          setBaseCode(data[0].code);
          setBenchmarkCode(data[1].code);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funds');
      }
    };
    loadFunds();
  }, []);

  const loadComparison = async () => {
    if (!baseCode || !benchmarkCode) return;
    try {
      setLoading(true);
      setError(null);
      const [base, benchmark] = await Promise.all([
        fetchFundDetails(baseCode, 'BYF', 365),
        fetchFundDetails(benchmarkCode, 'BYF', 365),
      ]);
      setBaseFund(base);
      setBenchmarkFund(benchmark);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benchmark');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [baseCode, benchmarkCode]);

  const chartData = useMemo(() => {
    if (!baseFund || !benchmarkFund) return [];
    const map: Record<string, Record<string, number>> = {};

    const normalize = (series: HistoricalPoint[]) => {
      const first = series[0]?.value || 1;
      return series.map((point) => ({
        date: point.date,
        value: ((point.value - first) / first) * 100,
      }));
    };

    const baseSeries = normalize(baseFund.priceHistory);
    const benchmarkSeries = normalize(benchmarkFund.priceHistory);

    baseSeries.forEach((point) => {
      map[point.date] = { ...(map[point.date] || {}), [baseFund.code]: point.value };
    });
    benchmarkSeries.forEach((point) => {
      map[point.date] = { ...(map[point.date] || {}), [benchmarkFund.code]: point.value };
    });

    return Object.keys(map)
      .sort()
      .map((date) => ({ date, ...map[date] }));
  }, [baseFund, benchmarkFund]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="title">Benchmark Karşılaştırması</h1>
          <p className="subtitle">BIST ETF'leri üzerinden fon performansını karşılaştırın.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-2">
          <label>
            Ana Fon (BYF)
            <select className="input" value={baseCode} onChange={(e) => setBaseCode(e.target.value)}>
              {funds.map((fund) => (
                <option key={fund.code} value={fund.code}>{fund.code} - {fund.title}</option>
              ))}
            </select>
          </label>
          <label>
            Benchmark Fon (BYF)
            <select className="input" value={benchmarkCode} onChange={(e) => setBenchmarkCode(e.target.value)}>
              {funds.map((fund) => (
                <option key={fund.code} value={fund.code}>{fund.code} - {fund.title}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="card">Yükleniyor...</div>}

      {!loading && baseFund && benchmarkFund && (
        <PerformanceChart
          data={chartData}
          metricLabel="Benchmark"
          selectedCodes={[baseFund.code, benchmarkFund.code]}
          isNormalized
        />
      )}
    </div>
  );
};

export default BenchmarkPage;
