import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers, useApproveUser, useRevokeUser } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  coordinator: "Coordinateur",
  mentor: "Mentor",
  entrepreneur: "Entrepreneur",
  evaluator: "Évaluateur",
  investor: "Investisseur",
  funder: "Bailleur",
};

const roleColors: Record<string, "green" | "blue" | "purple" | "amber" | "rose" | "gray"> = {
  super_admin: "rose",
  coordinator: "purple",
  mentor: "blue",
  entrepreneur: "green",
  evaluator: "amber",
  investor: "blue",
  funder: "amber",
};

export default function UsersPage() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const approve = useApproveUser();
  const revoke = useRevokeUser();

  const pending = users?.filter((u) => !u.is_approved) ?? [];
  const approved = users?.filter((u) => u.is_approved) ?? [];

  const handleApprove = (userId: string, name: string) => {
    approve.mutate(userId, {
      onSuccess: () => toast({ title: "Utilisateur approuvé", description: `${name} a maintenant accès à la plateforme.` }),
      onError: () => toast({ title: "Erreur", description: "Impossible d'approuver cet utilisateur.", variant: "destructive" }),
    });
  };

  const handleRevoke = (userId: string, name: string) => {
    revoke.mutate(userId, {
      onSuccess: () => toast({ title: "Accès révoqué", description: `${name} n'a plus accès à la plateforme.` }),
      onError: () => toast({ title: "Erreur", description: "Impossible de révoquer cet utilisateur.", variant: "destructive" }),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Gestion des utilisateurs"
        subtitle="Approuver les inscriptions et gérer les accès"
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard label="En attente" value={String(pending.length)} note="" color="amber" />
        <StatCard label="Approuvés" value={String(approved.length)} note="" color="green" />
        <StatCard label="Total" value={String(users?.length ?? 0)} note="" color="blue" />
      </div>

      {/* Pending users */}
      {pending.length > 0 && (
        <GhCard title="🔔 Inscriptions en attente" badge={String(pending.length)} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-secondary">
                  {["Nom", "Email", "Rôle", "Inscrit le", "Actions"].map((h) => (
                    <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{u.full_name || "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{u.email}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex gap-1 flex-wrap">{u.roles.map((r) => <Pill key={r} color={roleColors[r] ?? "gray"}>{roleLabels[r] ?? r}</Pill>)}</div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <GhButton onClick={() => handleApprove(u.user_id, u.full_name)} disabled={approve.isPending}>
                        ✓ Approuver
                      </GhButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GhCard>
      )}

      {/* Approved users */}
      <GhCard title="Utilisateurs actifs" badge={String(approved.length)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["Nom", "Email", "Rôles", "Inscrit le", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                ))
              ) : approved.length === 0 ? (
                <tr><td colSpan={5} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucun utilisateur approuvé</td></tr>
              ) : (
                approved.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{u.full_name || "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{u.email}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex gap-1 flex-wrap">{u.roles.map((r) => <Pill key={r} color={roleColors[r] ?? "gray"}>{roleLabels[r] ?? r}</Pill>)}</div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      {u.user_id !== user?.id ? (
                        <GhButton variant="ghost" onClick={() => handleRevoke(u.user_id, u.full_name)} disabled={revoke.isPending}>
                          Révoquer
                        </GhButton>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">Vous</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
