import { useState } from "react";
import BottomNav from "./components/BottomNav";
import type { Fund } from "./types";
import Funds from "./pages/Funds";
import FundDetail from "./pages/FundDetail";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Portfolio from "./pages/Portfolio";

type ViewKey = "home" | "funds" | "search" | "profile" | "fund-detail" | "portfolio";

export default function App() {
  const [view, setView] = useState<ViewKey>("home");
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);

  const goToFund = (fund: Fund) => {
    setSelectedFund(fund);
    setView("fund-detail");
  };

  const viewContent = () => {
    if (view === "home") {
      return (
        <Home onSelectFund={goToFund} onNavigate={() => setView("portfolio")} />
      );
    }
    if (view === "funds") {
      return <Funds onSelectFund={goToFund} />;
    }
    if (view === "fund-detail") {
      return <FundDetail fund={selectedFund} onBack={() => setView("funds")} />;
    }
    if (view === "search") {
      return <Search />;
    }
    if (view === "profile") {
      return <Profile onNavigate={() => setView("portfolio")} />;
    }
    if (view === "portfolio") {
      return <Portfolio onBack={() => setView("home")} />;
    }
    return null;
  };

  return (
    <main className="app">
      <div className="app__glow" aria-hidden="true" />

      <section className="page-shell" key={view} data-view={view}>
        {viewContent()}
      </section>

      <BottomNav
        active={view}
        onChange={(next) => setView(next)}
      />
    </main>
  );
}
