import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin", coordinator: "Coordinateur", mentor: "Mentor",
  entrepreneur: "Entrepreneur", evaluator: "Évaluateur", investor: "Investisseur", funder: "Bailleur",
};

export default function ProfilePage() {
  const { profile, roles, refetchProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone((profile as any).phone || "");
      setOrganization((profile as any).organization || "");
      setPosition((profile as any).position || "");
      setBio((profile as any).bio || "");
      setLinkedinUrl((profile as any).linkedin_url || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone: phone || null, organization: organization || null,
      position: position || null, bio: bio || null, linkedin_url: linkedinUrl || null,
    }).eq("user_id", profile!.user_id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Profil mis à jour" }); await refetchProfile(); }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Mon profil" subtitle="Gérez vos informations personnelles" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Nom complet</label><input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Email</label><input value={profile?.email || ""} disabled className={inputCls + " opacity-50"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Téléphone</label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Organisation</label><input value={organization} onChange={e => setOrganization(e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Poste</label><input value={position} onChange={e => setPosition(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">LinkedIn</label><input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/..." /></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} className={inputCls + " h-24 resize-none"} /></div>
              <GhButton type="submit" disabled={saving} variant="primary" size="md">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </GhButton>
            </form>
          </div>
        </div>
        <div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-foreground mx-auto">
                {fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
              </div>
              <div className="mt-3 font-display font-bold text-foreground">{fullName || "—"}</div>
              <div className="text-xs text-muted-foreground">{profile?.email}</div>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Rôles</div>
            <div className="flex flex-wrap gap-1.5">
              {roles.map(r => <Pill key={r} color="blue">{roleLabels[r] ?? r}</Pill>)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
