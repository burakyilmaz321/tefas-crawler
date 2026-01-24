type ViewKey = "home" | "funds" | "search" | "profile" | "fund-detail" | "portfolio";

type Props = {
  active: ViewKey;
  onChange: (next: ViewKey) => void;
};

const items: { key: ViewKey; label: string; icon: string }[] = [
  { key: "home", label: "Ana", icon: "nav-icon--home" },
  { key: "funds", label: "Fonlar", icon: "nav-icon--funds" },
  { key: "search", label: "Arama", icon: "nav-icon--search" },
  { key: "profile", label: "Profil", icon: "nav-icon--profile" }
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.key}
          className={item.key === active ? "nav-item active" : "nav-item"}
          onClick={() => onChange(item.key)}
        >
          <span className={`nav-icon ${item.icon}`} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
