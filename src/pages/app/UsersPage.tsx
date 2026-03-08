import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers, useApproveUser, useRevokeUser, useChangeUserRole, useInvitations } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import InviteUserDialog from "@/components/dialogs/InviteUserDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin", coordinator: "Coordinateur", mentor: "Mentor",
  entrepreneur: "Entrepreneur", evaluator: "Évaluateur", investor: "Investisseur", funder: "Bailleur",
};
const roleColors: Record<string, "green" | "blue" | "purple" | "amber" | "rose" | "gray"> = {
  super_admin: "rose", coordinator: "purple", mentor: "blue", entrepreneur: "green", evaluator: "amber", investor: "blue", funder: "amber",
};
const allRoles = ["super_admin", "coordinator", "mentor", "entrepreneur", "evaluator", "investor", "funder"];

export default function UsersPage() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const { data: invitations, isLoading: isLoadingInvitations } = useInvitations();
  const approve = useApproveUser();
  const revoke = useRevokeUser();
  const changeRole = useChangeUserRole();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const pending = users?.filter((u) => !u.is_approved) ?? [];
  const approved = users?.filter((u) => u.is_approved) ?? [];
  
  // Pending invitations only
  const pendingInvitations = invitations?.filter(i => i.status === "pending") ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <SectionHeader 
          title="Gestion des utilisateurs" 
          subtitle="Approuver les inscriptions et gérer les accès" 
        />
        <GhButton onClick={() => setIsInviteOpen(true)}>
          + Inviter un membre
        </GhButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Inscrits à valider" value={String(pending.length)} note="" color="amber" />
        <StatCard label="Utilisateurs Actifs" value={String(approved.length)} note="" color="green" />
        <StatCard label="Invitations envoyées" value={String(pendingInvitations.length)} note="" color="purple" />
        <StatCard label="Total" value={String(users?.length ?? 0)} note="" color="blue" />
      </div>

      <Tabs defaultValue="utilisateurs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="utilisateurs">Utilisateurs inscrits</TabsTrigger>
          <TabsTrigger value="invitations">Invitations en attente ({pendingInvitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="utilisateurs" className="space-y-5 mt-0">
          {pending.length > 0 && (
            <GhCard title="🔔 Inscriptions en attente" badge={String(pending.length)} noPadding>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead><tr className="bg-secondary">{["Nom", "Email", "Rôle", "Inscrit le", "Actions"].map((h) => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>)}</tr></thead>
                  <tbody>
                    {pending.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary transition-colors">
                        <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{u.full_name || "—"}</td>
                        <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{u.email}</td>
                        <td className="px-3.5 py-2.5 border-b border-border"><div className="flex gap-1 flex-wrap">{u.roles.map((r) => <Pill key={r} color={roleColors[r] ?? "gray"}>{roleLabels[r] ?? r}</Pill>)}</div></td>
                        <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="px-3.5 py-2.5 border-b border-border">
                          <GhButton onClick={() => approve.mutate(u.user_id, { onSuccess: () => toast({ title: `✓ ${u.full_name} approuvé` }) })} disabled={approve.isPending}>✓ Approuver</GhButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GhCard>
          )}

          <GhCard title="Utilisateurs actifs" badge={String(approved.length)} noPadding>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr className="bg-secondary">{["Nom", "Email", "Rôles", "Inscrit le", "Actions"].map((h) => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {isLoading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>) : approved.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState icon="👥" title="Aucun utilisateur approuvé" /></td></tr>
                  ) : approved.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{u.full_name || "—"}</td>
                      <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{u.email}</td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        {editingRole === u.user_id ? (
                          <select defaultValue={u.roles[0] || "entrepreneur"} onChange={e => {
                            changeRole.mutate({ userId: u.user_id, newRole: e.target.value }, { onSuccess: () => { toast({ title: `✓ Rôle mis à jour` }); setEditingRole(null); } });
                          }} className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground">
                            {allRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                          </select>
                        ) : (
                          <div className="flex gap-1 flex-wrap cursor-pointer" onClick={() => u.user_id !== user?.id && setEditingRole(u.user_id)}>
                            {u.roles.map((r) => <Pill key={r} color={roleColors[r] ?? "gray"}>{roleLabels[r] ?? r}</Pill>)}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        {u.user_id !== user?.id ? (
                          <GhButton variant="ghost" onClick={() => revoke.mutate(u.user_id, { onSuccess: () => toast({ title: `Accès révoqué pour ${u.full_name}` }) })} disabled={revoke.isPending}>Révoquer</GhButton>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">Vous</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GhCard>
        </TabsContent>

        <TabsContent value="invitations" className="mt-0">
          <GhCard title="Invitations en attente" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr className="bg-secondary">{["Email", "Rôle prévu", "Envoyée le", "Expire le", "Statut"].map((h) => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {isLoadingInvitations ? Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>) : pendingInvitations.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState icon="✉️" title="Aucune invitation en attente" /></td></tr>
                  ) : pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-medium text-foreground">{inv.email}</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color={roleColors[inv.role] ?? "gray"}>{roleLabels[inv.role] ?? inv.role}</Pill></td>
                      <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color="amber">En attente</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GhCard>
        </TabsContent>
      </Tabs>

      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </motion.div>
  );
}
