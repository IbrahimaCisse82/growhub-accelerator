import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/activites": "Activités",
  "/app/portefeuilles": "Portefeuilles",
  "/app/programmes": "Programmes",
  "/app/cohortes": "Cohortes",
  "/app/startups": "Startups",
  "/app/candidatures": "Candidatures",
  "/app/mentors": "Mentors",
  "/app/coaching": "Coaching & Sessions",
  "/app/lms": "LMS & Formation",
  "/app/projets": "Projets & Tâches",
  "/app/gantt": "Gantt",
  "/app/risques": "Risques",
  "/app/grants": "Grants & Subventions",
  "/app/budgets": "Budgets",
  "/app/evenements": "Événements",
  "/app/messagerie": "Messagerie",
  "/app/ressources": "Ressources",
  "/app/analytics": "Analytics",
  "/app/rapports": "Rapports",
};

export default function AppTopbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="h-14 bg-card/90 backdrop-blur-xl border-b border-border px-7 flex items-center justify-between sticky top-0 z-[100] flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-tertiary">
          <span>GrowHubLink</span>
          <span>›</span>
          <span className="text-text-secondary">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] font-body text-[12.5px] text-foreground outline-none transition-colors focus:border-gh-blue w-[220px] placeholder:text-text-tertiary"
          placeholder="🔍 Rechercher…"
        />
        <button className="relative bg-surface-2 border border-border text-text-secondary p-[7px] w-[34px] h-[34px] rounded-lg flex items-center justify-center hover:bg-surface-3 hover:text-foreground transition-colors text-sm">
          🔔
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-gh-rose rounded-full border-[1.5px] border-card" />
        </button>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg font-body text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
          + Nouveau
        </button>
      </div>
    </div>
  );
}
