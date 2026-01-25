import { useEffect, useState } from 'react';
import { fetchTechnicalScan } from '../api';
import { FundKind, TechnicalScanResult } from '../types';

const TechnicalScannerPage = () => {
  const [kind, setKind] = useState<FundKind>('YAT');
  const [rsiBelow, setRsiBelow] = useState(30);
  const [results, setResults] = useState<TechnicalScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTechnicalScan(kind, rsiBelow);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan funds');
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
          <h1 className="title">Teknik Tarayıcı</h1>
          <p className="subtitle">RSI ve SMA sinyallerine göre fon taraması yapın.</p>
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
            RSI Eşiği
            <input
              className="input"
              type="number"
              value={rsiBelow}
              onChange={(e) => setRsiBelow(Number(e.target.value))}
            />
          </label>
        </div>
        <button className="github-login-btn" style={{ marginTop: 12 }} onClick={loadResults} disabled={loading}>
          {loading ? 'Taranıyor...' : 'Teknik Tarama'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="section-title">Eşleşmeler ({results.length})</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Fon</th>
                <th>RSI</th>
                <th>SMA20</th>
                <th>SMA50</th>
                <th>Cross</th>
              </tr>
            </thead>
            <tbody>
              {results.map((fund) => (
                <tr key={fund.code}>
                  <td>{fund.code}</td>
                  <td>{fund.title}</td>
                  <td>{fund.rsi?.toFixed(1) ?? 'N/A'}</td>
                  <td>{fund.shortSma?.toFixed(2) ?? 'N/A'}</td>
                  <td>{fund.longSma?.toFixed(2) ?? 'N/A'}</td>
                  <td>{fund.smaCross ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TechnicalScannerPage;
