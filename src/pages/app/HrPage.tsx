import { useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import GhCard from "@/components/shared/GhCard";
import StatCard from "@/components/shared/StatCard";
import { useHrEmployees, useHrPayrollHistory } from "@/hooks/useHrEmployees";
import { calculerPaie, fmtXOF, DEFAULT_PAYROLL_PARAMS, MOIS, type HrEmployee } from "@/lib/payroll";
import { Plus, FileText, Users, DollarSign, TrendingUp, Trash2, Pencil, Eye, Download, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

const EMPTY_EMP: Partial<HrEmployee> = {
  matricule: "", prenom: "", nom: "", sexe: "M", date_naissance: "", lieu_naissance: "",
  nationalite: "Sénégalaise", adresse: "", telephone: "", email: "", situation_famille: "Célibataire",
  femmes: 0, enfants: 0, fonction: "", convention: "COMMERCE", categorie: "", statut: "employés",
  contrat: "CDI", date_entree: "", salaire_base: 0, sursalaire: 0, heures_absence: 0,
  heures_abs_maladie: 0, taux_maladie: 0, nb_paniers: 0, hs_115: 0, hs_140: 0, hs_160: 0, hs_200: 0,
  avance_tabaski: 0, avance_caisse: 0, avance_financiere: 0, ret_cooperative: 0, frais_medicaux: 0,
  ind_kilometrique: 0, is_active: true,
};

function BulletinModal({ emp, onClose }: { emp: HrEmployee; onClose: () => void }) {
  const paie = calculerPaie(emp, DEFAULT_PAYROLL_PARAMS);
  const lines = [
    { label: "Salaire de base", val: paie.salaireBase },
    { label: "Sursalaire", val: paie.sursalaire },
    { label: "Prime d'ancienneté", val: paie.primeAnc },
    { label: "Heures supplémentaires", val: paie.totalHS },
    { label: "Retenue absences", val: -paie.retAbsence },
    { label: "Indemnité maladie", val: paie.indMaladie },
    { label: "──── BRUT", val: paie.brut, bold: true },
    { label: "IR (Impôt sur le revenu)", val: -paie.ir },
    { label: "TRIMF", val: -paie.trimf },
    { label: "IPRES RG (salarial)", val: -paie.ipresRG_s },
    { label: "IPRES RC (salarial)", val: -paie.ipresRC_s },
    { label: "IPM (salarial)", val: -paie.ipm_s },
    { label: "──── Total retenues", val: -paie.totalRet, bold: true },
    { label: "Prime de transport", val: paie.transport },
    { label: "Prime de panier", val: paie.primePanier },
    { label: "Indemnité kilométrique", val: paie.indKilometrique },
    { label: "Total avances/retenues", val: -paie.totalAvances },
    { label: "══ NET À PAYER", val: paie.net, bold: true, highlight: true },
  ];

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} /> Bulletin de paie — {emp.prenom} {emp.nom}
          </DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-2">
          Matricule : {emp.matricule} · {emp.fonction} · Ancienneté : {paie.anc} ans ({(paie.ancRate * 100).toFixed(0)}%)
        </div>
        <div className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className={`flex justify-between py-1 px-2 rounded text-[12px] ${l.bold ? "font-bold" : ""} ${l.highlight ? "bg-primary/10 text-primary font-extrabold text-sm" : ""}`}>
              <span>{l.label}</span>
              <span className={l.val < 0 ? "text-destructive" : ""}>{fmtXOF(Math.abs(l.val))} {l.val < 0 ? "−" : ""} F</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <h4 className="text-xs font-bold text-muted-foreground mb-2">Charges patronales</h4>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span>CFCE</span><span className="text-right">{fmtXOF(paie.cfce)} F</span>
            <span>IPRES RG</span><span className="text-right">{fmtXOF(paie.ipresRG_p)} F</span>
            <span>IPRES RC</span><span className="text-right">{fmtXOF(paie.ipresRC_p)} F</span>
            <span>CSS AF</span><span className="text-right">{fmtXOF(paie.css_af)} F</span>
            <span>CSS AT</span><span className="text-right">{fmtXOF(paie.css_at)} F</span>
            <span>IPM</span><span className="text-right">{fmtXOF(paie.ipm_p)} F</span>
            <span className="font-bold">Total</span><span className="text-right font-bold">{fmtXOF(paie.chargesPat)} F</span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground">Masse salariale : <strong>{fmtXOF(paie.masse)} F CFA</strong></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeFormDialog({ emp, onSave, onClose, existingMats }: {
  emp: Partial<HrEmployee> | null; onSave: (e: Partial<HrEmployee>) => void; onClose: () => void; existingMats: string[];
}) {
  const [form, setForm] = useState<Partial<HrEmployee>>(emp || { ...EMPTY_EMP });
  const isEdit = !!emp?.id;

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.matricule || !form.prenom || !form.nom) {
      toast.error("Matricule, prénom et nom sont requis");
      return;
    }
    if (!isEdit && existingMats.includes(form.matricule!)) {
      toast.error("Ce matricule existe déjà");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="identite">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="emploi">Emploi & Salaire</TabsTrigger>
            <TabsTrigger value="avances">Avances & HS</TabsTrigger>
          </TabsList>

          <TabsContent value="identite" className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">Matricule *</Label><Input value={form.matricule || ""} onChange={e => set("matricule", e.target.value)} disabled={isEdit} /></div>
              <div><Label className="text-[11px]">Prénom *</Label><Input value={form.prenom || ""} onChange={e => set("prenom", e.target.value)} /></div>
              <div><Label className="text-[11px]">Nom *</Label><Input value={form.nom || ""} onChange={e => set("nom", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px]">Sexe</Label>
                <Select value={form.sexe || "M"} onValueChange={v => set("sexe", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Homme</SelectItem><SelectItem value="F">Femme</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px]">Date de naissance</Label><Input type="date" value={form.date_naissance || ""} onChange={e => set("date_naissance", e.target.value)} /></div>
              <div><Label className="text-[11px]">Lieu de naissance</Label><Input value={form.lieu_naissance || ""} onChange={e => set("lieu_naissance", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Téléphone</Label><Input value={form.telephone || ""} onChange={e => set("telephone", e.target.value)} /></div>
              <div><Label className="text-[11px]">Email</Label><Input value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px]">Situation familiale</Label>
                <Select value={form.situation_famille || "Célibataire"} onValueChange={v => set("situation_famille", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Célibataire">Célibataire</SelectItem>
                    <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                    <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                    <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px]">Nb femmes</Label><Input type="number" value={form.femmes ?? 0} onChange={e => set("femmes", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Nb enfants</Label><Input type="number" value={form.enfants ?? 0} onChange={e => set("enfants", +e.target.value)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="emploi" className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">Fonction</Label><Input value={form.fonction || ""} onChange={e => set("fonction", e.target.value)} /></div>
              <div><Label className="text-[11px]">Convention</Label><Input value={form.convention || ""} onChange={e => set("convention", e.target.value)} /></div>
              <div><Label className="text-[11px]">Catégorie</Label><Input value={form.categorie || ""} onChange={e => set("categorie", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px]">Statut</Label>
                <Select value={form.statut || "employés"} onValueChange={v => set("statut", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employés">Employé</SelectItem>
                    <SelectItem value="cadres">Cadre</SelectItem>
                    <SelectItem value="agents de maîtrise">Agent de maîtrise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Contrat</Label>
                <Select value={form.contrat || "CDI"} onValueChange={v => set("contrat", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px]">Date d'entrée</Label><Input type="date" value={form.date_entree || ""} onChange={e => set("date_entree", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Salaire de base (F CFA)</Label><Input type="number" value={form.salaire_base ?? 0} onChange={e => set("salaire_base", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Sursalaire (F CFA)</Label><Input type="number" value={form.sursalaire ?? 0} onChange={e => set("sursalaire", +e.target.value)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="avances" className="space-y-3 mt-3">
            <h4 className="text-xs font-bold text-muted-foreground">Heures supplémentaires</h4>
            <div className="grid grid-cols-4 gap-3">
              <div><Label className="text-[11px]">HS 115%</Label><Input type="number" value={form.hs_115 ?? 0} onChange={e => set("hs_115", +e.target.value)} /></div>
              <div><Label className="text-[11px]">HS 140%</Label><Input type="number" value={form.hs_140 ?? 0} onChange={e => set("hs_140", +e.target.value)} /></div>
              <div><Label className="text-[11px]">HS 160%</Label><Input type="number" value={form.hs_160 ?? 0} onChange={e => set("hs_160", +e.target.value)} /></div>
              <div><Label className="text-[11px]">HS 200%</Label><Input type="number" value={form.hs_200 ?? 0} onChange={e => set("hs_200", +e.target.value)} /></div>
            </div>
            <h4 className="text-xs font-bold text-muted-foreground mt-2">Avances & retenues</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">Avance Tabaski</Label><Input type="number" value={form.avance_tabaski ?? 0} onChange={e => set("avance_tabaski", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Avance caisse</Label><Input type="number" value={form.avance_caisse ?? 0} onChange={e => set("avance_caisse", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Avance financière</Label><Input type="number" value={form.avance_financiere ?? 0} onChange={e => set("avance_financiere", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Ret. coopérative</Label><Input type="number" value={form.ret_cooperative ?? 0} onChange={e => set("ret_cooperative", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Frais médicaux</Label><Input type="number" value={form.frais_medicaux ?? 0} onChange={e => set("frais_medicaux", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Ind. kilométrique</Label><Input type="number" value={form.ind_kilometrique ?? 0} onChange={e => set("ind_kilometrique", +e.target.value)} /></div>
            </div>
            <h4 className="text-xs font-bold text-muted-foreground mt-2">Absences</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">Heures absence</Label><Input type="number" value={form.heures_absence ?? 0} onChange={e => set("heures_absence", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Heures maladie</Label><Input type="number" value={form.heures_abs_maladie ?? 0} onChange={e => set("heures_abs_maladie", +e.target.value)} /></div>
              <div><Label className="text-[11px]">Nb paniers</Label><Input type="number" value={form.nb_paniers ?? 0} onChange={e => set("nb_paniers", +e.target.value)} /></div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 mt-4">
          <GhButton variant="ghost" size="sm" onClick={onClose}>Annuler</GhButton>
          <GhButton size="sm" onClick={handleSubmit}>{isEdit ? "Modifier" : "Créer"}</GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HrPage() {
  const { t } = useTranslation();
  const { employees, isLoading, upsert, remove } = useHrEmployees();
  const { history, saveSnapshot } = useHrPayrollHistory();
  const [showForm, setShowForm] = useState<Partial<HrEmployee> | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showBulletin, setShowBulletin] = useState<HrEmployee | null>(null);
  const [search, setSearch] = useState("");

  const allPaies = employees.map(e => ({ ...e, paie: calculerPaie(e, DEFAULT_PAYROLL_PARAMS) }));
  const filtered = allPaies.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule} ${e.fonction}`.toLowerCase().includes(search.toLowerCase())
  );

  const totaux = {
    brut: allPaies.reduce((s, e) => s + e.paie.brut, 0),
    net: allPaies.reduce((s, e) => s + e.paie.net, 0),
    charges: allPaies.reduce((s, e) => s + e.paie.chargesPat, 0),
    masse: allPaies.reduce((s, e) => s + e.paie.masse, 0),
  };

  const handleSave = async (emp: Partial<HrEmployee>) => {
    await upsert.mutateAsync(emp);
    setShowForm(null);
    setShowNew(false);
    toast.success("Employé enregistré");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet employé ?")) return;
    await remove.mutateAsync(id);
    toast.success("Employé supprimé");
  };

  const handleCloseMonth = async () => {
    const now = new Date();
    await saveSnapshot.mutateAsync({
      mois: now.getMonth(),
      annee: now.getFullYear(),
      total_brut: totaux.brut,
      total_net: totaux.net,
      total_charges: totaux.charges,
      total_masse: totaux.masse,
      nb_employes: employees.length,
    });
    toast.success(`${MOIS[now.getMonth()]} ${now.getFullYear()} clôturé`);
  };

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Gestion RH & Paie"
        subtitle="Gestion des employés, calcul de paie et bulletins de salaire — Barème sénégalais"
        actions={
          <div className="flex gap-2">
            <GhButton size="sm" variant="secondary" onClick={handleCloseMonth}>
              <Download size={14} className="mr-1" /> Clôturer le mois
            </GhButton>
            <GhButton size="sm" onClick={() => setShowNew(true)}>
              <Plus size={14} className="mr-1" /> Nouvel employé
            </GhButton>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Effectif" value={String(employees.length)} note="Employés actifs" color="blue" icon={<Users size={18} />} />
        <StatCard label="Masse salariale brute" value={`${fmtXOF(totaux.brut)} F`} note="Total mensuel" color="green" icon={<DollarSign size={18} />} />
        <StatCard label="Net total" value={`${fmtXOF(totaux.net)} F`} note="À verser" color="purple" icon={<TrendingUp size={18} />} />
        <StatCard label="Charges patronales" value={`${fmtXOF(totaux.charges)} F`} note="Cotisations" color="amber" icon={<DollarSign size={18} />} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
      </div>

      {/* Employee Table */}
      <GhCard title="Liste des employés" className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Matricule</th>
              <th className="py-2 px-3">Nom complet</th>
              <th className="py-2 px-3">Fonction</th>
              <th className="py-2 px-3">Statut</th>
              <th className="py-2 px-3">Contrat</th>
              <th className="py-2 px-3 text-right">Salaire base</th>
              <th className="py-2 px-3 text-right">Brut</th>
              <th className="py-2 px-3 text-right">Net</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                <td className="py-2.5 px-3 font-mono">{emp.matricule}</td>
                <td className="py-2.5 px-3 font-medium">{emp.prenom} {emp.nom}</td>
                <td className="py-2.5 px-3">{emp.fonction}</td>
                <td className="py-2.5 px-3 capitalize">{emp.statut}</td>
                <td className="py-2.5 px-3">{emp.contrat}</td>
                <td className="py-2.5 px-3 text-right font-mono">{fmtXOF(emp.salaire_base)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{fmtXOF(emp.paie.brut)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">{fmtXOF(emp.paie.net)}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setShowBulletin(emp)} className="p-1.5 rounded hover:bg-primary/10 text-primary"><Eye size={13} /></button>
                    <button onClick={() => setShowForm(emp)} className="p-1.5 rounded hover:bg-muted"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(emp.id!)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Aucun employé trouvé</td></tr>
            )}
          </tbody>
        </table>
      </GhCard>

      {/* Payroll History */}
      {history.length > 0 && (
        <GhCard title="Historique des clôtures">
          <h3 className="text-sm font-bold mb-3">Historique des clôtures</h3>
          <div className="space-y-1">
            {history.map((h: any) => (
              <div key={h.id} className="flex justify-between items-center py-1.5 px-2 text-[11px] rounded hover:bg-surface-2">
                <span className="font-medium">{MOIS[h.mois]} {h.annee}</span>
                <span>{h.nb_employes} emp.</span>
                <span className="font-mono">Brut: {fmtXOF(h.total_brut)} F</span>
                <span className="font-mono text-primary font-bold">Net: {fmtXOF(h.total_net)} F</span>
              </div>
            ))}
          </div>
        </GhCard>
      )}

      {/* Dialogs */}
      {showNew && <EmployeeFormDialog emp={{ ...EMPTY_EMP }} onSave={handleSave} onClose={() => setShowNew(false)} existingMats={employees.map(e => e.matricule)} />}
      {showForm && <EmployeeFormDialog emp={showForm} onSave={handleSave} onClose={() => setShowForm(null)} existingMats={employees.filter(e => e.id !== showForm.id).map(e => e.matricule)} />}
      {showBulletin && <BulletinModal emp={showBulletin} onClose={() => setShowBulletin(null)} />}
    </div>
  );
}
