import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-growhublink.png";

interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: string;
  badgeType?: "default" | "alert" | "new";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Vue Générale",
    items: [
      { label: "Dashboard", icon: "⬡", path: "/app/dashboard" },
      { label: "Activités", icon: "◎", path: "/app/activites", badge: "12", badgeType: "new" },
    ],
  },
  {
    label: "Accélération",
    items: [
      { label: "Portefeuilles", icon: "◈", path: "/app/portefeuilles" },
      { label: "Programmes", icon: "◇", path: "/app/programmes" },
      { label: "Cohortes", icon: "◉", path: "/app/cohortes", badge: "3" },
      { label: "Startups", icon: "△", path: "/app/startups", badge: "47" },
      { label: "Candidatures", icon: "✦", path: "/app/candidatures", badge: "8", badgeType: "alert" },
    ],
  },
  {
    label: "Accompagnement",
    items: [
      { label: "Mentors", icon: "◑", path: "/app/mentors" },
      { label: "Coaching", icon: "◐", path: "/app/coaching" },
      { label: "LMS & Cours", icon: "▣", path: "/app/lms" },
    ],
  },
  {
    label: "Gestion Projets",
    items: [
      { label: "Projets & Tâches", icon: "▦", path: "/app/projets" },
      { label: "Gantt", icon: "▤", path: "/app/gantt" },
      { label: "Risques", icon: "⚠", path: "/app/risques", badge: "3", badgeType: "alert" },
    ],
  },
  {
    label: "Financements",
    items: [
      { label: "Grants & Subventions", icon: "◎", path: "/app/grants" },
      { label: "Budgets", icon: "◫", path: "/app/budgets" },
    ],
  },
  {
    label: "Réseau",
    items: [
      { label: "Événements", icon: "◆", path: "/app/evenements" },
      { label: "Messagerie", icon: "◗", path: "/app/messagerie", badge: "5", badgeType: "alert" },
      { label: "Ressources", icon: "▨", path: "/app/ressources" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", icon: "◈", path: "/app/analytics" },
      { label: "Rapports", icon: "▦", path: "/app/rapports" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Utilisateurs", icon: "◉", path: "/app/utilisateurs", badge: "!", badgeType: "alert" },
    ],
  },
];

const badgeClasses: Record<string, string> = {
  default: "bg-surface-3 text-text-secondary",
  alert: "bg-gh-rose/15 text-gh-rose",
  new: "bg-primary/15 text-primary",
};

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const initials = profile?.full_name ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
  const mainRole = roles[0] ?? "user";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-card border-r border-border flex flex-col z-[200] scrollbar-hidden overflow-y-auto">
      {/* Logo */}
      <div className="px-[18px] py-[22px] border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GrowHubLink" className="h-8 w-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-text-tertiary px-2 mb-1">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] font-medium mb-0.5 transition-all relative select-none
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface-2 hover:text-foreground"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                  )}
                  <span className="text-[13px] w-4 text-center flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto font-mono text-[10px] px-1.5 py-px rounded-full ${badgeClasses[item.badgeType || "default"]}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors" onClick={signOut}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gh-blue to-gh-purple flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{profile?.full_name || "Utilisateur"}</div>
            <div className="font-mono text-[9px] text-text-tertiary mt-px">{mainRole} · Déconnexion</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
