import { useEffect, useMemo, useState } from "react";
import { fetchFundDetails } from "../api";
import PerformanceChart from "../components/PerformanceChart";
import type { Fund, FundOverview, HistoricalPoint } from "../types";

type Props = {
  fund: Fund | null;
  onBack: () => void;
};

export default function FundDetail({ fund, onBack }: Props) {
  const [overview, setOverview] = useState<FundOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fund) {
      return;
    }
    let active = true;
    setLoading(true);
    fetchFundDetails(fund.code, "YAT", 30)
      .then((data) => {
        if (active) {
          setOverview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Detaylar yuklenemedi");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fund]);

  const chartData = useMemo(() => {
    const history: HistoricalPoint[] = overview?.priceHistory ?? [];
    return history.slice(-7).map((point) => ({
      label: new Date(point.date).toLocaleDateString("tr-TR", {
        weekday: "short"
      }),
      value: Number(point.value.toFixed(2))
    }));
  }, [overview]);

  if (!fund) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Fon detay</h1>
        </header>
        <p className="empty">Fon secilmedi.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="back" onClick={onBack}>
          Geri
        </button>
        <div>
          <p className="eyebrow">{fund.code}</p>
          <h1>{overview?.title ?? fund.name}</h1>
        </div>
        <button className="chip">Takibe al</button>
      </header>

      <div className="detail-card">
        <div>
          <p className="muted">Gunluk getiri</p>
          <p className="detail-value">
            {overview ? `₺${overview.latestPrice.toFixed(2)}` : "—"}
          </p>
        </div>
        <div>
          <p className="muted">Risk seviyesi</p>
          <p className="detail-value">{fund.risk ?? "Orta"}</p>
        </div>
        <div>
          <p className="muted">Kategori</p>
          <p className="detail-value">{fund.category ?? "Hisse"}</p>
        </div>
      </div>

      {loading ? <div className="empty">Grafik yukleniyor...</div> : null}
      {error ? <div className="empty">{error}</div> : null}
      {!loading && !error ? (
        <PerformanceChart
          title="Fon performansi"
          subtitle={
            overview?.latestDate
              ? `Guncel: ${overview.latestDate}`
              : "Son 7 gun"
          }
          data={chartData.length ? chartData : undefined}
          showTabs={false}
        />
      ) : null}

      <section className="section">
        <div className="section__header">
          <h2>Dagilim</h2>
          <button className="chip chip--muted">Detay</button>
        </div>
        <div className="allocation">
          <div className="allocation__row">
            <span>Teknoloji</span>
            <span>32%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--orange" style={{ width: "32%" }} />
          </div>
          <div className="allocation__row">
            <span>Finans</span>
            <span>24%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--blue" style={{ width: "24%" }} />
          </div>
          <div className="allocation__row">
            <span>Tahvil</span>
            <span>18%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--green" style={{ width: "18%" }} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Gunluk metrikler</h2>
          <button className="link">Rapor</button>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <p className="muted">Net deger</p>
            <p>₺3.92</p>
          </div>
          <div className="summary-card">
            <p className="muted">Islem hacmi</p>
            <p>₺41.2M</p>
          </div>
          <div className="summary-card">
            <p className="muted">Yatirimci</p>
            <p>12.4K</p>
          </div>
        </div>
      </section>

      <div className="cta-bar">
        <button className="primary full">Alis</button>
        <button className="secondary full">Satis</button>
      </div>
    </div>
  );
}
