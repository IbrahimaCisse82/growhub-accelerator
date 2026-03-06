import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/useActivities";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actionLabels: Record<string, string> = {
  create: "Création", update: "Modification", delete: "Suppression",
  approve: "Approbation", revoke: "Révocation", login: "Connexion",
};

const entityLabels: Record<string, string> = {
  startup: "Startup", program: "Programme", cohort: "Cohorte", project: "Projet",
  grant: "Grant", event: "Événement", user: "Utilisateur", course: "Cours",
};

export default function ActivitesPage() {
  const { data: activities, isLoading } = useActivities();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Activités" subtitle="Fil d'activité de la plateforme" />
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : !activities || activities.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            Aucune activité enregistrée pour le moment
          </div>
        ) : (
          activities.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {a.action?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">
                  <span className="font-semibold">{actionLabels[a.action] ?? a.action}</span>
                  {a.entity_type && <span className="text-muted-foreground"> · {entityLabels[a.entity_type] ?? a.entity_type}</span>}
                </div>
                {a.metadata && <div className="text-[11px] text-muted-foreground truncate">{JSON.stringify(a.metadata)}</div>}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground flex-shrink-0">
                {format(new Date(a.created_at), "dd MMM HH:mm", { locale: fr })}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
