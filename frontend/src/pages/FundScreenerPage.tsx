import { useEffect, useState } from 'react';
import { fetchFundScreen } from '../api';
import { FundKind, FundScreenResult } from '../types';

const formatPercent = (value: number | null) => {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

const FundScreenerPage = () => {
  const [kind, setKind] = useState<FundKind>('YAT');
  const [minReturn1y, setMinReturn1y] = useState(20);
  const [minReturn1m, setMinReturn1m] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FundScreenResult[]>([]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFundScreen(kind, minReturn1y, minReturn1m);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screen results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [kind]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="title">Fon Tarayıcı</h1>
          <p className="subtitle">TEFAS fonlarında getiri ve risk filtresi uygulayın.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-3">
          <label>
            Fon Türü
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as FundKind)}>
              <option value="YAT">Yatırım (YAT)</option>
              <option value="EMK">Emeklilik (EMK)</option>
              <option value="BYF">Borsa Yatırım (BYF)</option>
            </select>
          </label>
          <label>
            Min 1Y Getiri (%)
            <input
              className="input"
              type="number"
              value={minReturn1y}
              onChange={(e) => setMinReturn1y(Number(e.target.value))}
            />
          </label>
          <label>
            Min 1M Getiri (%)
            <input
              className="input"
              type="number"
              value={minReturn1m}
              onChange={(e) => setMinReturn1m(Number(e.target.value))}
            />
          </label>
        </div>
        <button className="github-login-btn" style={{ marginTop: 12 }} onClick={loadResults} disabled={loading}>
          {loading ? 'Taranıyor...' : 'Taramayı Çalıştır'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="section-title">Sonuçlar ({results.length})</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Fon</th>
                <th>1M</th>
                <th>1Y</th>
                <th>Sharpe</th>
                <th>Volatilite</th>
                <th>Max Drawdown</th>
              </tr>
            </thead>
            <tbody>
              {results.map((fund) => (
                <tr key={fund.code}>
                  <td>{fund.code}</td>
                  <td>{fund.title}</td>
                  <td>{formatPercent(fund.return1m)}</td>
                  <td>{formatPercent(fund.return1y)}</td>
                  <td>{fund.sharpe?.toFixed(2) ?? 'N/A'}</td>
                  <td>{fund.volatility ? `${(fund.volatility * 100).toFixed(1)}%` : 'N/A'}</td>
                  <td>{fund.maxDrawdown ? `${(fund.maxDrawdown * 100).toFixed(1)}%` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FundScreenerPage;
