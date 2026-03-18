import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarCounts } from "@/hooks/useSidebarCounts";
import logo from "@/assets/logo-growhublink.png";

interface NavItem {
  label: string;
  icon: string;
  path: string;
  badgeKey?: string;
  badgeType?: "default" | "alert" | "new";
}

interface NavGroup {
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Vue Générale",
    items: [
      { label: "Dashboard", icon: "⬡", path: "/app/dashboard" },
      { label: "Activités", icon: "◎", path: "/app/activites", badgeKey: "activities", badgeType: "new" },
    ],
  },
  {
    label: "Gestion Projets",
    items: [
      { label: "Portefeuilles", icon: "◈", path: "/app/portefeuilles" },
      { label: "Programmes", icon: "◇", path: "/app/programmes" },
      { label: "Projets", icon: "▦", path: "/app/projets" },
      { label: "Jalons", icon: "🏁", path: "/app/jalons" },
      { label: "Tâches", icon: "☑", path: "/app/taches" },
      { label: "Gantt", icon: "▤", path: "/app/gantt" },
      { label: "Risques", icon: "⚠", path: "/app/risques", badgeKey: "openRisks", badgeType: "alert" },
    ],
  },
  {
    label: "Accélération",
    items: [
      { label: "Candidatures", icon: "✦", path: "/app/candidatures", badgeKey: "pendingApps", badgeType: "alert" },
      { label: "Entreprises", icon: "△", path: "/app/entreprises", badgeKey: "startups" },
      { label: "Cohortes", icon: "◉", path: "/app/cohortes", badgeKey: "activeCohorts" },
      { label: "Alumni", icon: "🎓", path: "/app/alumni" },
    ],
  },
  {
    label: "Accompagnement",
    items: [
      { label: "Mentors", icon: "◑", path: "/app/mentors" },
      { label: "Coaching", icon: "◐", path: "/app/coaching" },
      { label: "LMS & Cours", icon: "▣", path: "/app/lms" },
      { label: "Enquêtes", icon: "📋", path: "/app/enquetes" },
      { label: "Collecte données", icon: "📊", path: "/app/collecte-donnees" },
    ],
  },
  {
    label: "Financements",
    items: [
      { label: "Grants & Subventions", icon: "◎", path: "/app/grants" },
      { label: "Analytics Grants", icon: "◈", path: "/app/grants-analytics" },
      { label: "Budgets", icon: "◫", path: "/app/budgets" },
    ],
  },
  {
    label: "Réseau",
    items: [
      { label: "Partenaires", icon: "🤝", path: "/app/partenaires" },
      { label: "Événements", icon: "◆", path: "/app/evenements" },
      { label: "Messagerie", icon: "◗", path: "/app/messagerie", badgeKey: "unreadNotifs", badgeType: "alert" },
      { label: "Ressources", icon: "▨", path: "/app/ressources" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", icon: "◈", path: "/app/analytics" },
    ],
  },
  {
    label: "Insights Admin",
    adminOnly: true,
    items: [
      { label: "Rapports", icon: "▦", path: "/app/rapports" },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { label: "Utilisateurs", icon: "◉", path: "/app/utilisateurs", badgeType: "alert" },
      { label: "Webhooks", icon: "⚡", path: "/app/webhooks" },
    ],
  },
];

const badgeClasses: Record<string, string> = {
  default: "bg-surface-3 text-muted-foreground",
  alert: "bg-destructive/15 text-destructive",
  new: "bg-primary/15 text-primary",
};

interface AppSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function AppSidebar({ mobile, onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, isAdmin, signOut } = useAuth();
  const { data: counts } = useSidebarCounts();
  const initials = profile?.full_name ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
  const mainRole = roles[0] ?? "user";

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const getBadge = (item: NavItem): string | undefined => {
    if (!item.badgeKey || !counts) return undefined;
    const val = counts[item.badgeKey as keyof typeof counts];
    return val && val > 0 ? String(val) : undefined;
  };

  return (
    <aside className={mobile
      ? "w-full h-full bg-card flex flex-col scrollbar-hidden overflow-y-auto"
      : "fixed left-0 top-0 bottom-0 w-[240px] bg-card border-r border-border flex flex-col z-[200] scrollbar-hidden overflow-y-auto"
    }>
      {/* Logo */}
      <div className="px-[18px] py-[22px] border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GrowHub Accelerator" className="h-8 w-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1">
        {navGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          // Entrepreneurs & mentors only see Accompagnement + Réseau
          const isRestricted = roles.some(r => ["entrepreneur", "mentor"].includes(r)) && !isAdmin;
          if (isRestricted && !["Accompagnement", "Réseau"].includes(group.label)) return null;
          return (
            <div key={group.label} className="mb-5">
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground px-2 mb-1">
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                const badge = getBadge(item);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] font-medium mb-0.5 transition-all relative select-none
                      ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                    )}
                    <span className="text-[13px] w-4 text-center flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                    {badge && (
                      <span className={`ml-auto font-mono text-[10px] px-1.5 py-px rounded-full ${badgeClasses[item.badgeType || "default"]}`}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors" onClick={() => handleNav("/app/profil")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{profile?.full_name || "Utilisateur"}</div>
            <div className="font-mono text-[9px] text-muted-foreground mt-px">{mainRole}</div>
          </div>
        </div>
        <button onClick={signOut} className="w-full mt-1 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-colors text-left">
          ↪ Déconnexion
        </button>
      </div>
    </aside>
  );
}
