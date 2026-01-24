import PerformanceChart from "../components/PerformanceChart";
import type { Fund } from "../types";

type Props = {
  onSelectFund: (fund: Fund) => void;
  onNavigate: (view: "portfolio") => void;
};

const funds: Fund[] = [
  { code: "TI2", name: "Teknoloji Fon Sepeti", delta: "+1.4%" },
  { code: "PPN", name: "Para Piyasasi Fonu", delta: "+0.3%" },
  { code: "BYF", name: "Borsa Yatirim Fonu", delta: "-0.6%" }
];

export default function Home({ onSelectFund, onNavigate }: Props) {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" />
          <span className="brand__name">TEFAS</span>
        </div>
        <button className="icon-btn" aria-label="Bildirimler">
          <span className="icon-dot" />
          <span className="icon-dot" />
          <span className="icon-dot" />
        </button>
      </header>

      <section className="hero-card">
        <div className="hero__header">
          <div>
            <p className="eyebrow">Bugun ozeti</p>
            <h1>Portfoy nabzi</h1>
            <p className="sub">Grafik, trend ve risk tek bakista.</p>
          </div>
          <button className="chip">Akilli filtre</button>
        </div>

        <div className="kpi-row">
          <div className="kpi">
            <p className="kpi__label">Toplam</p>
            <p className="kpi__value">₺128.420</p>
            <span className="kpi__delta positive">+2.8%</span>
          </div>
          <div className="kpi">
            <p className="kpi__label">Gunun</p>
            <p className="kpi__value">₺1.240</p>
            <span className="kpi__delta positive">+0.6%</span>
          </div>
          <div className="kpi">
            <p className="kpi__label">Risk</p>
            <p className="kpi__value">Orta</p>
            <span className="kpi__delta neutral">Dengeli</span>
          </div>
        </div>

        <PerformanceChart />
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Hizli aksiyonlar</h2>
          <button className="link" onClick={() => onNavigate("portfolio")}>
            Portfoy detayi
          </button>
        </div>
        <div className="action-grid">
          <button className="action-card">
            <span className="action-icon action-icon--orange" />
            <span>Alim emri</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--blue" />
            <span>Satis emri</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--green" />
            <span>Fon tarama</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--purple" />
            <span>Rapor al</span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Trend fonlar</h2>
          <button className="chip chip--muted">Risk dengesi</button>
        </div>
        <div className="fund-list">
          {funds.map((fund) => (
            <button
              className="fund-item"
              key={fund.code}
              onClick={() => onSelectFund(fund)}
            >
              <div>
                <p className="fund-code">{fund.code}</p>
                <p className="fund-name">{fund.name}</p>
              </div>
              <span
                className={
                  fund.delta.startsWith("-")
                    ? "fund-delta negative"
                    : "fund-delta positive"
                }
              >
                {fund.delta}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
