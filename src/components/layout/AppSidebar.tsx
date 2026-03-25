import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarCounts } from "@/hooks/useSidebarCounts";
import { useTranslation } from "@/lib/i18n";
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

function useNavGroups() {
  const { t } = useTranslation();
  const navGroups: NavGroup[] = [
    {
      label: t("nav.overview"),
      items: [
        { label: t("nav.dashboard"), icon: "⬡", path: "/app/dashboard" },
        { label: t("nav.activities"), icon: "◎", path: "/app/activites", badgeKey: "activities", badgeType: "new" },
      ],
    },
    {
      label: t("nav.projectMgmt"),
      items: [
        { label: t("nav.portfolios"), icon: "◈", path: "/app/portefeuilles" },
        { label: t("nav.programs"), icon: "◇", path: "/app/programmes" },
        { label: t("nav.projects"), icon: "▦", path: "/app/projets" },
        { label: t("nav.milestones"), icon: "🏁", path: "/app/jalons" },
        { label: t("nav.tasks"), icon: "☑", path: "/app/taches" },
        { label: t("nav.gantt"), icon: "▤", path: "/app/gantt" },
        { label: t("nav.risks"), icon: "⚠", path: "/app/risques", badgeKey: "openRisks", badgeType: "alert" },
      ],
    },
    {
      label: t("nav.acceleration"),
      items: [
        { label: t("nav.applications"), icon: "✦", path: "/app/candidatures", badgeKey: "pendingApps", badgeType: "alert" },
        { label: "Funnel Builder", icon: "⚙", path: "/app/funnel-builder" },
        { label: t("nav.startups"), icon: "△", path: "/app/entreprises", badgeKey: "startups" },
        { label: t("nav.cohorts"), icon: "◉", path: "/app/cohortes", badgeKey: "activeCohorts" },
        { label: t("nav.alumni"), icon: "🎓", path: "/app/alumni" },
      ],
    },
    {
      label: t("nav.support"),
      items: [
        { label: t("nav.mentors"), icon: "◑", path: "/app/mentors" },
        { label: t("nav.matching"), icon: "🔗", path: "/app/matching" },
        { label: t("nav.coaching"), icon: "◐", path: "/app/coaching" },
        { label: t("nav.scheduling"), icon: "📅", path: "/app/rdv" },
        { label: t("nav.lms"), icon: "▣", path: "/app/lms" },
        { label: t("nav.surveys"), icon: "📋", path: "/app/enquetes" },
        { label: t("nav.dataCollection"), icon: "📊", path: "/app/collecte-donnees" },
      ],
    },
    {
      label: t("nav.funding"),
      items: [
        { label: t("nav.grants"), icon: "◎", path: "/app/grants" },
        { label: t("nav.grantsAnalytics"), icon: "◈", path: "/app/grants-analytics" },
        { label: t("nav.budgets"), icon: "◫", path: "/app/budgets" },
      ],
    },
    {
      label: t("nav.network"),
      items: [
        { label: t("nav.marketplace"), icon: "🏪", path: "/app/marketplace" },
        { label: t("nav.partners"), icon: "🤝", path: "/app/partenaires" },
        { label: t("nav.events"), icon: "◆", path: "/app/evenements" },
        { label: t("nav.messaging"), icon: "◗", path: "/app/messagerie", badgeKey: "unreadNotifs", badgeType: "alert" },
        { label: t("nav.resources"), icon: "▨", path: "/app/ressources" },
      ],
    },
    {
      label: t("nav.insights"),
      items: [
        { label: t("nav.analytics"), icon: "◈", path: "/app/analytics" },
      ],
    },
    {
      label: t("nav.insightsAdmin"),
      adminOnly: true,
      items: [
        { label: t("nav.reports"), icon: "▦", path: "/app/rapports" },
      ],
    },
    {
      label: t("nav.admin"),
      adminOnly: true,
      items: [
        { label: t("nav.users"), icon: "◉", path: "/app/utilisateurs", badgeType: "alert" },
        { label: t("nav.webhooks"), icon: "⚡", path: "/app/webhooks" },
      ],
    },
  ];
  return navGroups;
}

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
  const { t } = useTranslation();
  const { data: counts } = useSidebarCounts();
  const navGroups = useNavGroups();
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
      <div className="px-[18px] py-[22px] border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GrowHub Accelerator" className="h-8 w-auto" />
        </div>
      </div>

      <nav className="p-3 flex-1">
        {navGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          const isRestricted = roles.some(r => ["entrepreneur", "mentor"].includes(r)) && !isAdmin;
          const allowedGroups = [
            t("nav.overview"), t("nav.support"), t("nav.network"),
            // Hardcoded fallbacks for locale changes
            "Vue Générale", "Accompagnement", "Réseau", "Overview", "Support", "Network",
            "نظرة عامة", "المرافقة", "الشبكة",
          ];
          if (isRestricted && !allowedGroups.includes(group.label)) return null;
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
        <div className="flex gap-1 mt-1">
          <button onClick={() => handleNav("/app/parametres")} className="flex-1 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-colors text-left">
            ⚙ Paramètres
          </button>
          <button onClick={signOut} className="flex-1 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-colors text-left">
            ↪ {t("nav.logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
