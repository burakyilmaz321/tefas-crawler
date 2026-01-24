import PerformanceChart from "../components/PerformanceChart";

type Props = {
  onBack: () => void;
};

export default function Portfolio({ onBack }: Props) {
  return (
    <div className="page">
      <header className="page-header">
        <button className="back" onClick={onBack}>
          Geri
        </button>
        <div>
          <p className="eyebrow">Portfoy</p>
          <h1>Genel durum</h1>
        </div>
        <button className="chip">Rapor al</button>
      </header>

      <div className="detail-card">
        <div>
          <p className="muted">Toplam varlik</p>
          <p className="detail-value">₺412.880</p>
        </div>
        <div>
          <p className="muted">Gunluk degisim</p>
          <p className="detail-value positive">+₺3.140</p>
        </div>
        <div>
          <p className="muted">Hedef</p>
          <p className="detail-value">₺500K</p>
        </div>
      </div>

      <PerformanceChart title="Portfoy trendi" subtitle="Son 6 ay" />

      <section className="section">
        <div className="section__header">
          <h2>Dagilim</h2>
          <button className="chip chip--muted">Guncelle</button>
        </div>
        <div className="allocation">
          <div className="allocation__row">
            <span>Hisse</span>
            <span>48%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--orange" style={{ width: "48%" }} />
          </div>
          <div className="allocation__row">
            <span>Likidite</span>
            <span>22%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--blue" style={{ width: "22%" }} />
          </div>
          <div className="allocation__row">
            <span>Altin</span>
            <span>14%</span>
          </div>
          <div className="allocation__bar">
            <span className="bar bar--green" style={{ width: "14%" }} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Hedef takibi</h2>
          <button className="link">Duzenle</button>
        </div>
        <div className="goal-card">
          <p className="muted">Uzun vadeli hedef</p>
          <p className="goal-title">Finansal bagimsizlik</p>
          <div className="goal-progress">
            <span className="bar bar--purple" style={{ width: "64%" }} />
          </div>
          <p className="muted">%64 tamamlandi</p>
        </div>
      </section>
    </div>
  );
}
