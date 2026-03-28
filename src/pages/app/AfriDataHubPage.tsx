import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import GhButton from "@/components/shared/GhButton";
import {
  Globe, Handshake, FolderKanban, Building2, Landmark, FileText, Users2, Sparkles,
  Search, MapPin, Calendar, DollarSign, ChevronRight, Building, Briefcase, Target
} from "lucide-react";
import {
  accords, programmes, projets, financeurs, appelsOffres, partiesPrenantes, dashboardStats,
  ALL_SECTORS, type Accord, type Programme, type Projet, type Financeur, type AppelOffre, type PartiesPrenantes as PP
} from "@/lib/afridata-hub-data";

/* ─── Status badge colors ─── */
const statusColor: Record<string, string> = {
  "Actif": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "En cours": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Terminé": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Planifié": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "Ouvert": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "En évaluation": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Attribué": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Clos": "bg-muted text-muted-foreground",
  "Suspendu": "bg-red-500/15 text-red-700 dark:text-red-400",
  "Annulé": "bg-red-500/15 text-red-700 dark:text-red-400",
};

const typeColor: Record<string, string> = {
  "Banque": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Agence": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Fonds": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "Fondation": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Investisseur": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  "Donateur": "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "Gouvernement": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Entreprise": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "ONG": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Institution": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "Partenaire technique": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  "Bailleur": "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "Travaux": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Fourniture": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Services": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "Consultation": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "PPP": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
function TypeBadge({ type }: { type: string }) {
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor[type] ?? "bg-muted text-muted-foreground"}`}>{type}</span>;
}
function SectorBadge({ sector }: { sector: string }) {
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{sector}</span>;
}

/* ─── Filter bar ─── */
function FilterBar({ search, onSearch, sectorFilter, onSectorFilter, placeholder }: {
  search: string; onSearch: (v: string) => void; sectorFilter: string; onSectorFilter: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>
      <select value={sectorFilter} onChange={e => onSectorFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
        <option value="">Tous les secteurs</option>
        {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

/* ─── Stat box ─── */
function StatBox({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="font-mono text-xl font-bold text-foreground leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ─── Dashboard tab ─── */
function DashboardTab() {
  const s = dashboardStats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatBox label="Accords" value={s.accords} icon={Handshake} />
        <StatBox label="Programmes" value={s.programmes} icon={FolderKanban} />
        <StatBox label="Projets" value={s.projets} icon={Building2} />
        <StatBox label="Financeurs" value={s.financeurs} icon={Landmark} />
        <StatBox label="Parties prenantes" value={s.partiesPrenantes} icon={Users2} />
        <StatBox label="Pays" value={s.pays} icon={Globe} />
        <StatBox label="Montant total" value={s.montantTotal} icon={DollarSign} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GhCard title="Accords récents">
          <div className="space-y-3">
            {accords.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />{a.parties.split("↔")[0].trim()}
                    <Calendar className="h-3 w-3 ml-1" />{a.date}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <SectorBadge sector={a.sector} />
                    {a.amount && <span className="text-[10px] font-medium text-foreground">{a.amount}</span>}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </GhCard>
        <GhCard title="Projets structurants">
          <div className="space-y-3">
            {projets.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />{p.country}
                    <Calendar className="h-3 w-3 ml-1" />{p.date}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <SectorBadge sector={p.sector} />
                    {p.amount && <span className="text-[10px] font-medium text-foreground">{p.amount}</span>}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </GhCard>
      </div>
    </div>
  );
}

/* ─── Generic list card ─── */
function ItemCard({ title, status, description, meta, badges, amount, type }: {
  title: string; status?: string; description: string; meta: { icon: React.ElementType; text: string }[];
  badges: string[]; amount?: string; type?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:-translate-y-px transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</h3>
        <div className="flex gap-1.5 shrink-0">
          {type && <TypeBadge type={type} />}
          {status && <StatusBadge status={status} />}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2.5">{description}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2">
        {meta.map((m, i) => (
          <span key={i} className="flex items-center gap-1"><m.icon className="h-3 w-3" />{m.text}</span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {badges.map((b, i) => <SectorBadge key={i} sector={b} />)}
        {amount && <span className="text-[10px] font-semibold text-foreground ml-1">{amount}</span>}
      </div>
    </div>
  );
}

/* ─── Accords tab ─── */
function AccordsTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const filtered = useMemo(() => accords.filter(a =>
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) || a.parties.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || a.sector === sector)
  ), [search, sector]);
  return (
    <div>
      <FilterBar search={search} onSearch={setSearch} sectorFilter={sector} onSectorFilter={setSector} placeholder="Rechercher par pays ou titre..." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((a, i) => (
          <ItemCard key={i} title={a.title} status={a.status} description={a.description}
            meta={[{ icon: MapPin, text: a.parties }, { icon: Calendar, text: a.date }]}
            badges={[a.sector]} amount={a.amount} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucun accord trouvé</div>}
    </div>
  );
}

/* ─── Programmes tab ─── */
function ProgrammesTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const filtered = useMemo(() => programmes.filter(p =>
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || p.sector === sector)
  ), [search, sector]);
  return (
    <div>
      <FilterBar search={search} onSearch={setSearch} sectorFilter={sector} onSectorFilter={setSector} placeholder="Rechercher par pays ou nom..." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p, i) => (
          <ItemCard key={i} title={p.title} status={p.status} description={p.description}
            meta={[{ icon: MapPin, text: p.country }, { icon: Calendar, text: p.date }, { icon: Building, text: p.agency }]}
            badges={[p.sector]} amount={p.amount} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucun programme trouvé</div>}
    </div>
  );
}

/* ─── Projets tab ─── */
function ProjetsTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const filtered = useMemo(() => projets.filter(p =>
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || p.sector === sector)
  ), [search, sector]);
  return (
    <div>
      <FilterBar search={search} onSearch={setSearch} sectorFilter={sector} onSectorFilter={setSector} placeholder="Rechercher par pays, nom ou agence..." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p, i) => (
          <ItemCard key={i} title={p.title} status={p.status} description={p.description}
            meta={[{ icon: MapPin, text: p.country }, { icon: Calendar, text: p.date }, { icon: Building, text: p.agency }]}
            badges={[p.sector]} amount={p.amount} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucun projet trouvé</div>}
    </div>
  );
}

/* ─── Financeurs tab ─── */
function FinanceursTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const types = ["Banque", "Agence", "Fonds", "Fondation", "Investisseur", "Donateur"];
  const filtered = useMemo(() => financeurs.filter(f =>
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.country.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || f.sectors.includes(sector)) &&
    (!typeFilter || f.type === typeFilter)
  ), [search, sector, typeFilter]);
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, pays ou description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sector} onChange={e => setSector(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les secteurs</option>
          {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{filtered.length} financeurs trouvés</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((f, i) => (
          <ItemCard key={i} title={f.name} type={f.type} description={f.description}
            meta={[{ icon: Globe, text: f.country }, { icon: MapPin, text: f.scope }]}
            badges={f.sectors.slice(0, 3)} amount={f.amount} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucun financeur trouvé</div>}
    </div>
  );
}

/* ─── Appels d'offres tab ─── */
function AppelsTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const types = ["Travaux", "Fourniture", "Services", "Consultation", "PPP"];
  const statuses = ["Ouvert", "En évaluation", "Attribué", "Clos", "Annulé"];
  const filtered = useMemo(() => appelsOffres.filter(a =>
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) || a.country.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || a.sector === sector) &&
    (!typeFilter || a.type === typeFilter) &&
    (!statusFilter || a.status === statusFilter)
  ), [search, sector, typeFilter, statusFilter]);
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par titre, pays, organisme..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sector} onChange={e => setSector(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les secteurs</option>
          {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les statuts</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{filtered.length} appels d'offres trouvés</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((a, i) => (
          <ItemCard key={i} title={a.title} status={a.status} type={a.type} description={a.description}
            meta={[{ icon: MapPin, text: a.country }, { icon: Building, text: a.agency }, { icon: Calendar, text: `Limite: ${a.deadline}` }]}
            badges={[a.sector]} amount={a.amount} />
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucun appel d'offres trouvé</div>}
    </div>
  );
}

/* ─── Parties prenantes tab ─── */
function PartiesTab() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const types = ["Gouvernement", "Entreprise", "ONG", "Institution", "Partenaire technique", "Bailleur"];
  const filtered = useMemo(() => partiesPrenantes.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || p.sectors.includes(sector)) &&
    (!typeFilter || p.type === typeFilter)
  ), [search, sector, typeFilter]);
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, pays ou description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sector} onChange={e => setSector(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <option value="">Tous les secteurs</option>
          {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{filtered.length} parties prenantes trouvées</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:-translate-y-px transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{p.name}</h3>
              <TypeBadge type={p.type} />
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.country}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{p.role}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {p.sectors.map((s, j) => <SectorBadge key={j} sector={s} />)}
            </div>
            {p.projects.length > 0 && (
              <div className="border-t border-border pt-2 mt-2">
                {p.projects.map((pr, j) => (
                  <div key={j} className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />{pr}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Aucune partie prenante trouvée</div>}
    </div>
  );
}

/* ─── Analyse IA tab ─── */
function AnalyseTab() {
  const [projectDesc, setProjectDesc] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<null | { summary: string }>(null);

  const handleAnalyze = () => {
    if (!projectDesc.trim()) return;
    setIsAnalyzing(true);
    setResults(null);
    // Simulate analysis
    setTimeout(() => {
      setResults({
        summary: `Analyse complète pour le projet décrit. Nous avons identifié des correspondances potentielles avec ${Math.floor(Math.random() * 5) + 3} accords, ${Math.floor(Math.random() * 4) + 2} programmes, ${Math.floor(Math.random() * 6) + 4} financeurs et ${Math.floor(Math.random() * 3) + 2} appels d'offres compatibles. Consultez les onglets correspondants pour explorer les opportunités.`,
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <GhCard title="Soumettre un projet">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Décrivez votre projet</label>
            <Textarea
              placeholder="Décrivez le projet, son secteur, son pays, ses objectifs..."
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </div>
          <GhButton onClick={handleAnalyze} disabled={isAnalyzing || !projectDesc.trim()} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
          </GhButton>
        </div>
      </GhCard>
      <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
        {results ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold text-sm">Résultats de l'analyse</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{results.summary}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Les résultats de l'analyse apparaîtront ici</p>
            <p className="text-xs mt-1">Soumettez un projet pour lancer le matching sur les 6 catégories</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AfriDataHubPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="AfriDataHub"
        subtitle="Données économiques africaines — Accords, programmes, projets et financements du continent"
      />

      <Tabs defaultValue="dashboard" className="mt-2">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5"><Globe className="h-3.5 w-3.5" />Tableau de bord</TabsTrigger>
          <TabsTrigger value="accords" className="text-xs gap-1.5"><Handshake className="h-3.5 w-3.5" />Accords</TabsTrigger>
          <TabsTrigger value="programmes" className="text-xs gap-1.5"><FolderKanban className="h-3.5 w-3.5" />Programmes</TabsTrigger>
          <TabsTrigger value="projets" className="text-xs gap-1.5"><Building2 className="h-3.5 w-3.5" />Projets</TabsTrigger>
          <TabsTrigger value="financeurs" className="text-xs gap-1.5"><Landmark className="h-3.5 w-3.5" />Financeurs</TabsTrigger>
          <TabsTrigger value="appels" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" />Appels d'offres</TabsTrigger>
          <TabsTrigger value="parties" className="text-xs gap-1.5"><Users2 className="h-3.5 w-3.5" />Parties prenantes</TabsTrigger>
          <TabsTrigger value="analyse" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" />Analyse IA</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="accords"><AccordsTab /></TabsContent>
        <TabsContent value="programmes"><ProgrammesTab /></TabsContent>
        <TabsContent value="projets"><ProjetsTab /></TabsContent>
        <TabsContent value="financeurs"><FinanceursTab /></TabsContent>
        <TabsContent value="appels"><AppelsTab /></TabsContent>
        <TabsContent value="parties"><PartiesTab /></TabsContent>
        <TabsContent value="analyse"><AnalyseTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
}
