export default function Search() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kesif</p>
          <h1>Arama</h1>
        </div>
      </header>

      <div className="search-bar search-bar--full">
        <span className="search-icon" />
        <input placeholder="Fon, sektor veya tema ara" />
      </div>

      <section className="section">
        <div className="section__header">
          <h2>Populer etiketler</h2>
        </div>
        <div className="tag-row">
          <button className="pill">Yenilenebilir</button>
          <button className="pill">Teknoloji</button>
          <button className="pill">Altin</button>
          <button className="pill">Yurtdisi</button>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Onerilen fonlar</h2>
          <button className="link">Tumunu gor</button>
        </div>
        <div className="fund-list">
          <div className="fund-item">
            <div>
              <p className="fund-code">TBN</p>
              <p className="fund-name">Teknoloji Buyume</p>
            </div>
            <span className="fund-delta positive">+1.9%</span>
          </div>
          <div className="fund-item">
            <div>
              <p className="fund-code">ALT</p>
              <p className="fund-name">Altin Fonu</p>
            </div>
            <span className="fund-delta positive">+0.4%</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Son aramalar</h2>
        </div>
        <div className="recent-list">
          <button className="recent-item">Hisse fonlari</button>
          <button className="recent-item">Yabanci teknoloji</button>
          <button className="recent-item">Kisa vade borclanma</button>
        </div>
      </section>
    </div>
  );
}
