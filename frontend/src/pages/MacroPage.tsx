import { useEffect, useState } from 'react';
import { fetchMacroSeries } from '../api';
import { MacroSeries } from '../types';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const MacroPage = () => {
  const [symbol, setSymbol] = useState('USDTRY');
  const [series, setSeries] = useState<MacroSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMacroSeries(symbol, 365);
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load macro series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, [symbol]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="title">Makro Göstergeler</h1>
          <p className="subtitle">Ücretsiz döviz verileri ile fon performansını kıyaslayın.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label>
          Kur
          <select className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="USDTRY">USD/TRY</option>
            <option value="EURTRY">EUR/TRY</option>
          </select>
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="card">Yükleniyor...</div>}

      {!loading && series && series.series.length === 0 && (
        <div className="card">Kaynak verisi bulunamadı. Lütfen daha sonra tekrar deneyin.</div>
      )}

      {!loading && series && series.series.length > 0 && (
        <div className="card">
          <div className="section-title">{series.symbol} (Son 12 Ay)</div>
          {series.source && (
            <p className="subtitle" style={{ marginTop: 4 }}>Kaynak: {series.source}</p>
          )}
          <div className="chart-wrapper" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.series} margin={{ top: 12, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" minTickGap={40} tickMargin={12} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroPage;
