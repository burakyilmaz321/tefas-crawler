type Props = {
  onNavigate: (view: "portfolio") => void;
};

export default function Profile({ onNavigate }: Props) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Hesap</p>
          <h1>Profil & ayarlar</h1>
        </div>
      </header>

      <section className="profile-card">
        <div className="avatar">AY</div>
        <div>
          <h2>Ayse Y.</h2>
          <p className="muted">Premium yatirimci</p>
        </div>
        <button className="chip">Profili duzenle</button>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Hizli erisim</h2>
        </div>
        <div className="action-grid">
          <button className="action-card" onClick={() => onNavigate("portfolio")}>
            <span className="action-icon action-icon--orange" />
            <span>Portfoy ozeti</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--blue" />
            <span>Bildirim kutusu</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--green" />
            <span>Guvenlik</span>
          </button>
          <button className="action-card">
            <span className="action-icon action-icon--purple" />
            <span>Raporlar</span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Ayarlar</h2>
        </div>
        <div className="settings-list">
          <button className="settings-item">
            <span>Bildirim tercihleri</span>
            <span className="pill">Acik</span>
          </button>
          <button className="settings-item">
            <span>Guvenlik ve PIN</span>
            <span className="pill">Guncelle</span>
          </button>
          <button className="settings-item">
            <span>Destek</span>
            <span className="pill">7/24</span>
          </button>
        </div>
      </section>
    </div>
  );
}
