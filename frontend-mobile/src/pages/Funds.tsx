import { useEffect, useMemo, useState } from "react";
import { fetchFunds } from "../api";
import type { Fund, FundSummary } from "../types";

type Props = {
  onSelectFund: (fund: Fund) => void;
};

export default function Funds({ onSelectFund }: Props) {
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchFunds()
      .then((items) => {
        if (active) {
          setFunds(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Veri yuklenemedi");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const list = useMemo(() => funds.slice(0, 12), [funds]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tum fonlar</p>
          <h1>Fon kesfi</h1>
        </div>
        <button className="chip">Akilli filtre</button>
      </header>

      <div className="search-bar">
        <span className="search-icon" />
        <input placeholder="Fon ara, kod veya tema" />
        <button className="chip chip--muted">Sirala</button>
      </div>

      <div className="filter-row">
        <button className="pill active">Gunun</button>
        <button className="pill">Dusuk risk</button>
        <button className="pill">Likit</button>
        <button className="pill">Tematik</button>
      </div>

      <div className="fund-list">
        {loading ? <div className="empty">Fonlar yukleniyor...</div> : null}
        {error ? <div className="empty">{error}</div> : null}
        {!loading && !error
          ? list.map((fund) => {
              const mapped: Fund = {
                code: fund.code,
                name: fund.title,
                delta: ""
              };
              return (
                <button
                  className="fund-item fund-item--wide"
                  key={fund.code}
                  onClick={() => onSelectFund(mapped)}
                >
                  <div className="fund-meta">
                    <p className="fund-code">{fund.code}</p>
                    <p className="fund-name">{fund.title}</p>
                    <div className="fund-tags">
                      <span className="tag">{fund.kind}</span>
                      <span className="tag">Guncel: {fund.latestDate}</span>
                    </div>
                  </div>
                  <div className="fund-right">
                    <span className="fund-delta neutral">Detay</span>
                    <div className="spark" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}
