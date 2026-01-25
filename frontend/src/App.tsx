import { useCallback, useEffect, useMemo, useState } from 'react';
import FundSelector from './components/FundSelector';
import FundCard from './components/FundCard';
import PerformanceChart from './components/PerformanceChart';
import ExportPage from './pages/ExportPage';
import FundScreenerPage from './pages/FundScreenerPage';
import PortfolioPage from './pages/PortfolioPage';
import BenchmarkPage from './pages/BenchmarkPage';
import MacroPage from './pages/MacroPage';
import TechnicalScannerPage from './pages/TechnicalScannerPage';
import EventsPage from './pages/EventsPage';
import { ChartSkeleton, FundCardSkeleton } from './components/LoadingSkeleton';
import { fetchFundDetails, fetchFunds } from './api';
import { FundKind, FundOverview, FundSummary, HistoricalPoint } from './types';
import { useAuth } from './context/AuthContext';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  calculateSharpeRatio,
  calculateVolatility,
  calculateMaxDrawdown,
  formatSharpeRatio,
  formatVolatility,
  formatMaxDrawdown
} from './utils/analytics';

const timeFilters = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'YBB', days: 'ybb' },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 365 * 3 },
  { label: '5Y', days: 365 * 5 },
];

const metricFilters = [
  { label: 'Price', key: 'priceHistory' },
  { label: 'Investors', key: 'investorHistory' },
  { label: 'Market Cap', key: 'marketCapHistory' },
];

const fundKinds: { label: string; value: FundKind }[] = [
  { label: 'Yatırım Fonları (YAT)', value: 'YAT' },
  { label: 'Emeklilik Fonları (EMK)', value: 'EMK' },
  { label: 'Borsa Yatırım Fonları (BYF)', value: 'BYF' },
];

// Chart colors for funds - matches PerformanceChart.tsx
const fundColors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];

const App = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'screener' | 'portfolio' | 'benchmark' | 'macro' | 'technical' | 'events' | 'export'>('home');
  const [fundKind, setFundKind] = useState<FundKind>('YAT');
  const [isNormalized, setIsNormalized] = useState(false);
  const [showMA, setShowMA] = useState(false);
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<FundOverview[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<{ code: string; kind: FundKind }[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState(timeFilters[3]); // 3M default
  const [activeMetric, setActiveMetric] = useState(metricFilters[0]); // Price default
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, signInWithGithub, signOut } = useAuth();
  const isAuthEnabled = isSupabaseConfigured;

  // Save current selection to Supabase
  const savePortfolio = async () => {
    if (!isAuthEnabled || !user || selectedCodes.length === 0) return;
    try {
      const { error } = await supabase.from('portfolios').upsert({
        user_id: user.id,
        name: 'My Portfolio',
        fund_list: selectedCodes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,name' });
      if (error) throw error;
      alert('Portföy kaydedildi!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Portföy kaydedilemedi.');
    }
  };

  // Load portfolio from Supabase on login
  useEffect(() => {
    if (!isAuthEnabled || !user) return;
    const loadPortfolio = async () => {
      const { data } = await supabase
        .from('portfolios')
        .select('fund_list')
        .eq('user_id', user.id)
        .single();
      if (data?.fund_list && Array.isArray(data.fund_list)) {
        setSelectedCodes(data.fund_list);
      }
    };
    loadPortfolio();
  }, [isAuthEnabled, user]);

  // Fetch fund list on mount or when kind changes
  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoadingFunds(true);
        setError(null);
        const data = await fetchFunds(fundKind);
        setFunds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funds');
      } finally {
        setLoadingFunds(false);
      }
    };
    loadFunds();
  }, [fundKind]);

  // Load fund details when selection changes or range changes
  useEffect(() => {
    const loadNewDetails = async () => {
      // Determine the actual number of days for 'YBB'
      const daysParam = activeTimeFilter.days === 'ybb' ? getDaysForYBB() : (activeTimeFilter.days as number);

      // Find codes that don't have details yet or need updating due to range change
      const toFetch = selectedCodes.filter(
        ({ code }) => {
          const existingFund = selectedFunds.find((f) => f.code === code);
          if (!existingFund) return true;
          const history = existingFund[activeMetric.key as keyof FundOverview] as HistoricalPoint[];
          return !history || history.length < daysParam;
        }
      );

      if (toFetch.length === 0) {
        setSelectedFunds((prev) => prev.filter((f) => selectedCodes.some(s => s.code === f.code)));
        return;
      }

      try {
        setLoadingDetails(true);
        const newFunds = await Promise.all(
          toFetch.map(({ code, kind }) => fetchFundDetails(code, kind, daysParam))
        );
        setSelectedFunds((prev) => {
          const codesToReplace = toFetch.map(f => f.code);
          const currentCodes = selectedCodes.map(s => s.code);
          const updatedFunds = prev.filter((f) => !codesToReplace.includes(f.code) && currentCodes.includes(f.code));
          return [...updatedFunds, ...newFunds];
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fund details');
        setSelectedCodes(prev => prev.filter(c => !toFetch.some(f => f.code === c.code)));
      } finally {
        setLoadingDetails(false);
      }
    };

    loadNewDetails();
    setSelectedFunds((prev) => prev.filter((f) => selectedCodes.some(s => s.code === f.code)));
  }, [selectedCodes, activeTimeFilter.days, activeMetric.key, refreshKey]);

  const handleFundSelect = useCallback((fund: FundSummary) => {
    setSelectedCodes((prev) =>
      prev.some(s => s.code === fund.code)
        ? prev.filter((s) => s.code !== fund.code)
        : prev.length < 5
          ? [...prev, { code: fund.code, kind: fund.kind }]
          : prev
    );
  }, []);

  const handleRemoveFund = useCallback((code: string) => {
    setSelectedCodes(prev => prev.filter(s => s.code !== code));
  }, []);

  const handleRefresh = useCallback(() => {
    setSelectedFunds([]); // Clear cached fund data to force refetch
    setRefreshKey(k => k + 1); // Trigger useEffect
  }, []);

  const getDaysForYBB = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const chartData = useMemo(() => {
    if (selectedFunds.length === 0) return [];

    const days = activeTimeFilter.days === 'ybb' ? getDaysForYBB() : (activeTimeFilter.days as number);
    const dateMap: Record<string, Record<string, number>> = {};

    // Helper to calculate Simple Moving Average on FULL data
    const calculateSMA = (data: HistoricalPoint[], period: number): Map<string, number> => {
      const result = new Map<string, number>();
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p.value, 0);
        result.set(data[i].date, sum / period);
      }
      return result;
    };

    selectedFunds.forEach(fund => {
      const history = fund[activeMetric.key as keyof FundOverview] as HistoricalPoint[];
      if (!history || history.length === 0) return;

      // Calculate MAs on FULL history data (not sliced)
      const ma50Map = showMA ? calculateSMA(history, 50) : null;
      const ma200Map = showMA ? calculateSMA(history, 200) : null;

      // Now slice for display
      const startIndex = Math.max(history.length - (days || 1), 0);
      const slice = history.slice(startIndex);
      const baseValue = slice[0]?.value;

      // For normalized MA, we need the base MA value at the start of the slice
      const baseMa50 = ma50Map?.get(slice[0]?.date) ?? null;
      const baseMa200 = ma200Map?.get(slice[0]?.date) ?? null;

      slice.forEach((point) => {
        const dateStr = point.date;
        if (!dateMap[dateStr]) dateMap[dateStr] = {};

        if (isNormalized && baseValue !== 0) {
          dateMap[dateStr][fund.code] = ((point.value / baseValue) - 1) * 100;
        } else {
          dateMap[dateStr][fund.code] = point.value;
        }

        // Add MA values if enabled (from full history calculation)
        if (showMA && ma50Map) {
          const ma50Value = ma50Map.get(dateStr);
          if (ma50Value !== undefined) {
            if (isNormalized && baseMa50 !== null && baseMa50 !== 0) {
              dateMap[dateStr][`${fund.code}_MA50`] = ((ma50Value / baseMa50) - 1) * 100;
            } else if (!isNormalized) {
              dateMap[dateStr][`${fund.code}_MA50`] = ma50Value;
            }
          }
        }
        if (showMA && ma200Map) {
          const ma200Value = ma200Map.get(dateStr);
          if (ma200Value !== undefined) {
            if (isNormalized && baseMa200 !== null && baseMa200 !== 0) {
              dateMap[dateStr][`${fund.code}_MA200`] = ((ma200Value / baseMa200) - 1) * 100;
            } else if (!isNormalized) {
              dateMap[dateStr][`${fund.code}_MA200`] = ma200Value;
            }
          }
        }
      });
    });

    return Object.entries(dateMap)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedFunds, activeTimeFilter, activeMetric, isNormalized, showMA]);

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <p className="title">TEFAS Fund Dashboard</p>
          <p className="subtitle">Interactive performance tracking for multiple investment funds</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#64748b' }}>{user.email || user.user_metadata?.user_name}</span>
              <button className="chip active" onClick={savePortfolio} disabled={selectedCodes.length === 0}>
                💾 Kaydet
              </button>
              <button className="chip" onClick={signOut}>Çıkış</button>
            </>
          ) : (
            <button
              className="github-login-btn"
              onClick={signInWithGithub}
              disabled={!isAuthEnabled}
              title={!isAuthEnabled ? 'Supabase ortam değişkenleri eksik.' : 'GitHub ile giriş'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub ile Giriş
            </button>
          )}
          <div className="badge">Tefas Crawler Engine</div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Anasayfa
        </button>
        <button
          className={`tab ${activeTab === 'screener' ? 'active' : ''}`}
          onClick={() => setActiveTab('screener')}
        >
          Fon Tarayıcı
        </button>
        <button
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portföy
        </button>
        <button
          className={`tab ${activeTab === 'benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmark')}
        >
          Benchmark
        </button>
        <button
          className={`tab ${activeTab === 'macro' ? 'active' : ''}`}
          onClick={() => setActiveTab('macro')}
        >
          Makro
        </button>
        <button
          className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          Teknik Tarama
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Takvim
        </button>
        <button
          className={`tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>

      {/* Conditional Page Rendering */}
      {activeTab === 'export' && <ExportPage fundKind={fundKind} />}
      {activeTab === 'screener' && <FundScreenerPage />}
      {activeTab === 'portfolio' && <PortfolioPage />}
      {activeTab === 'benchmark' && <BenchmarkPage />}
      {activeTab === 'macro' && <MacroPage />}
      {activeTab === 'technical' && <TechnicalScannerPage />}
      {activeTab === 'events' && <EventsPage />}

      {activeTab === 'home' && (
        <>
          {error && (
            <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
              <p style={{ color: '#dc2626', margin: 0 }}>Error: {error}</p>
            </div>
          )}

          <div className="filter-group">
            <div className="filter-row" style={{ marginBottom: 16 }}>
              <span className="filter-label">Fund Type:</span>
              <div className="chip-group">
                {fundKinds.map((kind) => (
                  <button
                    key={kind.value}
                    className={`chip ${fundKind === kind.value ? 'active' : ''}`}
                    onClick={() => setFundKind(kind.value)}
                  >
                    {kind.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <FundSelector
                funds={funds}
                selectedCodes={selectedCodes.map(s => s.code)}
                onSelect={handleFundSelect}
                loading={loadingFunds}
              />
            </div>

            <div className="selected-funds-grid">
              {loadingDetails && selectedCodes.length > selectedFunds.length ? (
                <>
                  {selectedFunds.map(fund => (
                    <FundCard key={fund.code} fund={fund} onRemove={() => handleRemoveFund(fund.code)} />
                  ))}
                  {Array.from({ length: selectedCodes.length - selectedFunds.length }).map((_, i) => (
                    <FundCardSkeleton key={`skeleton-${i}`} />
                  ))}
                </>
              ) : (
                selectedFunds.map(fund => (
                  <FundCard key={fund.code} fund={fund} onRemove={() => handleRemoveFund(fund.code)} />
                ))
              )}
            </div>

            <div className="card">
              <div className="filter-row" style={{ marginBottom: 16 }}>
                <span className="filter-label">Time Period:</span>
                <div className="chip-group">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.label}
                      className={`chip ${filter.label === activeTimeFilter.label ? 'active' : ''}`}
                      onClick={() => setActiveTimeFilter(filter)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row" style={{ marginBottom: 16 }}>
                <span className="filter-label">Metric:</span>
                <div className="chip-group">
                  {metricFilters.map((filter) => (
                    <button
                      key={filter.label}
                      className={`chip ${filter.label === activeMetric.label ? 'active' : ''}`}
                      onClick={() => setActiveMetric(filter)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-label">Chart Mode:</span>
                <div className="chip-group">
                  <button
                    className={`chip ${isNormalized ? 'active' : ''}`}
                    onClick={() => setIsNormalized(!isNormalized)}
                  >
                    Percentage Change (%)
                  </button>
                  <button
                    className={`chip ${showMA ? 'active' : ''}`}
                    onClick={() => setShowMA(!showMA)}
                  >
                    Moving Averages (MA50/MA200)
                  </button>
                  <button
                    className="chip"
                    onClick={handleRefresh}
                    disabled={loadingDetails || selectedCodes.length === 0}
                    style={{ marginLeft: 'auto' }}
                  >
                    🔄 {loadingDetails ? 'Yükleniyor...' : 'Yenile'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedFunds.length > 0 ? (
            <>
              {loadingDetails ? (
                <ChartSkeleton />
              ) : (
                <PerformanceChart
                  data={chartData}
                  metricLabel={activeMetric.label}
                  selectedCodes={selectedCodes.map(s => s.code)}
                  isNormalized={isNormalized}
                  showMA={showMA}
                />
              )}

              {/* Analytics Panel */}
              <div className="card" style={{ marginTop: 16 }}>
                <h3 className="section-title">Risk & Performance Metrics</h3>
                <div className="analytics-grid">
                  {selectedFunds.map((fund, index) => {
                    const sharpe = fund.priceHistory ? calculateSharpeRatio(fund.priceHistory) : null;
                    const volatility = fund.priceHistory ? calculateVolatility(fund.priceHistory) : null;
                    const maxDD = fund.priceHistory ? calculateMaxDrawdown(fund.priceHistory) : null;

                    return (
                      <div
                        key={fund.code}
                        className="analytics-card"
                        style={{ borderLeftColor: fundColors[index % fundColors.length] }}
                      >
                        <div className="analytics-fund-code">{fund.code}</div>
                        <div className="analytics-metrics">
                          <div className="analytics-metric">
                            <span className="analytics-label">Sharpe Ratio:</span>
                            <span className="analytics-value">{formatSharpeRatio(sharpe)}</span>
                          </div>
                          <div className="analytics-metric">
                            <span className="analytics-label">Volatility:</span>
                            <span className="analytics-value">{formatVolatility(volatility)}</span>
                          </div>
                          <div className="analytics-metric">
                            <span className="analytics-label">Max Drawdown:</span>
                            <span className="analytics-value negative">{formatMaxDrawdown(maxDD)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px', background: '#f8fafc' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                Select up to 5 funds to start tracking their performance.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
