import { useEffect, useState } from 'react';
import { fetchPortfolioValuation } from '../api';
import { formatTry, formatTry6 } from '../utils/format';
import { PortfolioHoldingInput, PortfolioValuation } from '../types';

const STORAGE_KEY = 'portfolioHoldings';

const PortfolioPage = () => {
  const [holdings, setHoldings] = useState<PortfolioHoldingInput[]>([]);
  const [code, setCode] = useState('');
  const [shares, setShares] = useState(100);
  const [cost, setCost] = useState(1);
  const [valuation, setValuation] = useState<PortfolioValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHoldings(JSON.parse(stored));
      } catch {
        setHoldings([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const addHolding = () => {
    if (!code.trim() || shares <= 0) return;
    setHoldings((prev) => [
      ...prev,
      { code: code.trim().toUpperCase(), shares, cost },
    ]);
    setCode('');
  };

  const removeHolding = (index: number) => {
    setHoldings((prev) => prev.filter((_, idx) => idx !== index));
  };

  const calculate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPortfolioValuation(holdings);
      setValuation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to value portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="title">Portföy Yönetimi</h1>
          <p className="subtitle">Fonlarınızı ekleyin, toplam değer ve risk görünümünü takip edin.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-3">
          <label>
            Fon Kodu
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label>
            Adet
            <input className="input" type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))} />
          </label>
          <label>
            Maliyet (TL)
            <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="github-login-btn" onClick={addHolding}>Ekle</button>
          <button className="github-login-btn" onClick={calculate} disabled={loading || holdings.length === 0}>
            {loading ? 'Hesaplanıyor...' : 'Portföyü Hesapla'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Eklenen Fonlar</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Adet</th>
                <th>Maliyet</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr key={`${holding.code}-${index}`}>
                  <td>{holding.code}</td>
                  <td>{holding.shares}</td>
                  <td>{holding.cost}</td>
                  <td>
                    <button className="chip" onClick={() => removeHolding(index)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {valuation && (
        <div className="card">
          <div className="section-title">Portföy Özeti</div>
          <div className="grid grid-3">
            <div>
              <div className="metric-value">{formatTry(valuation.totalValue)}</div>
              <div className="metric-label">Toplam Değer</div>
            </div>
            <div>
              <div className="metric-value">{formatTry(valuation.pnl)}</div>
              <div className="metric-label">Kar/Zarar</div>
            </div>
            <div>
              <div className="metric-value">{valuation.pnlPct ? `${(valuation.pnlPct * 100).toFixed(1)}%` : 'N/A'}</div>
              <div className="metric-label">Getiri</div>
            </div>
          </div>
          <div className="table-wrapper" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Son Fiyat</th>
                  <th>Değer</th>
                  <th>Ağırlık</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                {valuation.holdings.map((holding) => (
                  <tr key={holding.code}>
                    <td>{holding.code}</td>
                    <td>{formatTry6(holding.latestPrice)}</td>
                    <td>{formatTry(holding.value)}</td>
                    <td>{(holding.weight * 100).toFixed(1)}%</td>
                    <td>{formatTry(holding.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
