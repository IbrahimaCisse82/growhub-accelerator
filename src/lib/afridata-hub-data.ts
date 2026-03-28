// ─── Static dataset for AfriDataHub ───

export type Sector = "Infrastructure" | "Énergie" | "Agriculture" | "Numérique" | "Santé" | "Éducation" | "Transport" | "Mines" | "Industrie" | "Commerce" | "Eau & Assainissement" | "Tourisme" | "Défense" | "Finance";
export const ALL_SECTORS: Sector[] = ["Infrastructure", "Énergie", "Agriculture", "Numérique", "Santé", "Éducation", "Transport", "Mines", "Industrie", "Commerce", "Eau & Assainissement", "Tourisme", "Défense", "Finance"];

export type AccordStatus = "Actif" | "En cours" | "Terminé" | "Suspendu";
export interface Accord { title: string; status: AccordStatus; description: string; parties: string; date: string; sector: string; amount: string; }

export const accords: Accord[] = [
  { title: "Zone de Libre-Échange Continentale Africaine (ZLECAf)", status: "Actif", description: "Plus grande zone de libre-échange au monde par nombre de pays. 54 signataires, 48 ratifications.", parties: "Union Africaine (54 pays) ↔ Continental", date: "2018-03-21", sector: "Commerce", amount: "3 400 milliards USD" },
  { title: "Accords de Partenariat Économique UE – Afrique de l'Ouest (APE)", status: "En cours", description: "Accord de partenariat économique régional entre l'UE et les pays d'Afrique de l'Ouest.", parties: "CEDEAO (15 pays) ↔ Union Européenne", date: "2024-06-30", sector: "Commerce", amount: "Réductions tarifaires progressives" },
  { title: "Forum sur la Coopération sino-africaine (FOCAC) – Plan 2025-2027", status: "Actif", description: "Plan d'action triennal adopté au sommet de Pékin. 10 actions de partenariat.", parties: "Union Africaine (54 pays) ↔ Chine", date: "2024-09-06", sector: "Commerce", amount: "50.7 milliards USD" },
  { title: "Accord-cadre TICAD 9 Afrique – Japon", status: "Actif", description: "Engagements de la 9e conférence TICAD. Investissements en infrastructure de qualité.", parties: "Union Africaine (54 pays) ↔ Japon", date: "2025-08-21", sector: "Infrastructure", amount: "30 milliards USD" },
  { title: "Accord de partenariat UE-UA Global Gateway pour l'Afrique", status: "Actif", description: "Paquet d'investissement Global Gateway pour l'Afrique. Infrastructures numériques, transport, énergie.", parties: "Union Africaine (54 pays) ↔ Union Européenne", date: "2023-10-25", sector: "Infrastructure", amount: "150 milliards EUR" },
  { title: "Partenariat Hydrogène Vert Maroc – Allemagne", status: "Actif", description: "Accord stratégique pour le développement de l'hydrogène vert au Maroc.", parties: "Maroc ↔ Allemagne", date: "2023-06-12", sector: "Énergie", amount: "3.5 milliards EUR" },
  { title: "17 accords de coopération Maroc – Sénégal", status: "Actif", description: "Signature de 17 accords lors de la 15e session de la Grande Commission mixte.", parties: "Maroc ↔ Sénégal", date: "2026-01-27", sector: "Commerce", amount: "" },
  { title: "Accord énergétique Tunisie – Italie (ELMED)", status: "En cours", description: "Interconnexion électrique sous-marine entre la Tunisie et l'Italie.", parties: "Tunisie ↔ Italie", date: "2024-07-16", sector: "Énergie", amount: "850 millions EUR" },
  { title: "Interconnexion électrique Égypte – Grèce (GREGY)", status: "En cours", description: "Câble sous-marin de 1 396 km entre l'Égypte et la Grèce via la Crète.", parties: "Égypte ↔ Grèce", date: "2024-10-05", sector: "Énergie", amount: "3.5 milliards EUR" },
  { title: "Accord gazier Égypte – Israël – UE (EastMed Gas Forum)", status: "Actif", description: "Mémorandum d'entente tripartite pour l'export de gaz naturel vers l'Europe.", parties: "Égypte ↔ Israël ↔ UE", date: "2020-01-16", sector: "Énergie", amount: "" },
  { title: "Accord industriel automobile Maroc – Chine (BYD / Gotion)", status: "Actif", description: "Installation d'usines de batteries et de véhicules électriques au Maroc.", parties: "Maroc ↔ Chine", date: "2024-03-15", sector: "Industrie", amount: "1.3 milliards USD" },
  { title: "Partenariat Tunisie – France transition numérique", status: "Actif", description: "Programme de coopération pour le développement du numérique en Tunisie.", parties: "Tunisie ↔ France", date: "2024-04-22", sector: "Numérique", amount: "100 millions EUR" },
];

export interface Programme { title: string; status: string; description: string; country: string; date: string; agency: string; sector: string; amount: string; }

export const programmes: Programme[] = [
  { title: "Agenda 2063 – L'Afrique que nous voulons", status: "Actif", description: "Cadre stratégique continental pour la transformation socio-économique de l'Afrique sur 50 ans.", country: "Union Africaine (54 pays)", date: "2015-01-01", agency: "Commission de l'Union Africaine", sector: "Commerce", amount: "Non chiffré" },
  { title: "Programme de Développement des Infrastructures en Afrique (PIDA)", status: "Actif", description: "Programme continental visant à combler le déficit d'infrastructure de l'Afrique.", country: "Union Africaine (54 pays)", date: "2012-01-01", agency: "AUDA-NEPAD / BAD", sector: "Infrastructure", amount: "360 milliards USD" },
  { title: "PDDAA/CAADP – Agriculture Africaine", status: "Actif", description: "Cadre continental pour la transformation agricole. Objectif : 6% de croissance agricole annuelle.", country: "Union Africaine (54 pays)", date: "2003-01-01", agency: "AUDA-NEPAD / CUA", sector: "Agriculture", amount: "Multisectoriel" },
  { title: "Nouveau Modèle de Développement (NMD) du Maroc", status: "Actif", description: "Refonte du modèle de développement marocain. Objectifs : doubler le PIB par habitant d'ici 2035.", country: "Maroc", date: "2021-01-01", agency: "Commission Spéciale sur le NMD", sector: "Industrie", amount: "Non chiffré globalement" },
  { title: "Stratégie Génération Green 2020-2030", status: "Actif", description: "Successeur du Plan Maroc Vert. Priorité à la valorisation du capital humain agricole.", country: "Maroc", date: "2020-01-01", agency: "Ministère de l'Agriculture du Maroc", sector: "Agriculture", amount: "5 milliards USD" },
  { title: "Plan de Transformation de l'Accélération Industrielle (PAI 2.0)", status: "Actif", description: "Deuxième phase de la stratégie industrielle marocaine. Cibles : automobile, aéronautique.", country: "Maroc", date: "2021-01-01", agency: "Ministère de l'Industrie du Maroc", sector: "Industrie", amount: "3 milliards USD" },
  { title: "Vision 2030 de l'Égypte", status: "Actif", description: "Stratégie nationale couvrant les dimensions économique, sociale et environnementale.", country: "Égypte", date: "2016-01-01", agency: "Gouvernement de l'Égypte", sector: "Infrastructure", amount: "Multisectoriel" },
  { title: "Programme National des Énergies Renouvelables – Algérie", status: "Actif", description: "Programme ambitieux visant 15 GW de capacité renouvelable d'ici 2035.", country: "Algérie", date: "2015-01-01", agency: "Ministère de la Transition Énergétique", sector: "Énergie", amount: "120 milliards USD" },
  { title: "Plan de Développement 2023-2025 – Tunisie", status: "Actif", description: "Plan de relance post-COVID. Réformes structurelles, investissement dans les infrastructures.", country: "Tunisie", date: "2023-01-01", agency: "Gouvernement de Tunisie", sector: "Infrastructure", amount: "5.4 milliards USD" },
  { title: "Plan Sénégal Émergent (PSE)", status: "Actif", description: "Stratégie nationale de développement économique et social.", country: "Sénégal", date: "2014-01-01", agency: "Gouvernement du Sénégal", sector: "Infrastructure", amount: "Multisectoriel" },
  { title: "Agenda de Transformation Nationale Sénégal 2050", status: "Actif", description: "Nouveau référentiel succédant au PSE.", country: "Sénégal", date: "2025-01-01", agency: "Présidence du Sénégal", sector: "Infrastructure", amount: "Multisectoriel" },
];

export type ProjetStatus = "En cours" | "Terminé" | "Planifié";
export interface Projet { title: string; status: ProjetStatus; description: string; country: string; date: string; agency: string; sector: string; amount: string; }

export const projets: Projet[] = [
  { title: "Train Express Régional (TER) Dakar", status: "En cours", description: "Ligne ferroviaire de 55 km reliant Dakar à l'AIBD via Diamniadio.", country: "Sénégal", date: "2016-12-14", agency: "APIX / SETER", sector: "Transport", amount: "1.2 milliards EUR" },
  { title: "Centrale solaire Noor Ouarzazate (Noor I-IV)", status: "Terminé", description: "Plus grand complexe solaire multi-technologique au monde (580 MW).", country: "Maroc", date: "2013-05-01", agency: "MASEN", sector: "Énergie", amount: "2.5 milliards USD" },
  { title: "Konza Technopolis – Silicon Savannah", status: "En cours", description: "Ville technologique intelligente sur 2 000 ha à 60 km de Nairobi.", country: "Kenya", date: "2013-01-01", agency: "Konza Technopolis Development Authority", sector: "Numérique", amount: "14.5 milliards USD" },
  { title: "Port en eau profonde de Kribi (Phase 2)", status: "En cours", description: "Deuxième plus grand port industriel d'Afrique centrale.", country: "Cameroun", date: "2011-01-01", agency: "PAK", sector: "Infrastructure", amount: "1.3 milliards USD" },
  { title: "Grand Barrage de la Renaissance Éthiopienne (GERD)", status: "En cours", description: "Plus grand barrage hydroélectrique d'Afrique (6 450 MW).", country: "Éthiopie", date: "2011-04-02", agency: "Ethiopian Electric Power", sector: "Énergie", amount: "4.8 milliards USD" },
  { title: "Corridor ferroviaire de Lobito", status: "En cours", description: "Modernisation du corridor ferroviaire de 1 300 km.", country: "Angola", date: "2023-09-01", agency: "Africa Finance Corporation / US DFC", sector: "Transport", amount: "4 milliards USD" },
  { title: "Nouvelle Capitale Administrative de l'Égypte", status: "En cours", description: "Ville nouvelle de 700 km² à l'est du Caire.", country: "Égypte", date: "2015-03-01", agency: "ACUD", sector: "Infrastructure", amount: "58 milliards USD" },
  { title: "Projet d'hydrogène vert AMAN (Mauritanie)", status: "Planifié", description: "Méga-projet de production d'hydrogène vert.", country: "Mauritanie", date: "2025-01-01", agency: "CWP Global / Chariot", sector: "Énergie", amount: "34 milliards USD" },
  { title: "Modernisation du Transgabonais", status: "En cours", description: "Programme de modernisation de la ligne ferroviaire unique du Gabon.", country: "Gabon", date: "2025-11-24", agency: "SETRAG / AFD", sector: "Transport", amount: "320 millions EUR" },
  { title: "BRT d'Abidjan (Bus Rapid Transit)", status: "En cours", description: "Première ligne BRT d'Abidjan de 20 km.", country: "Côte d'Ivoire", date: "2023-01-01", agency: "Gouvernement de Côte d'Ivoire", sector: "Transport", amount: "400 millions USD" },
];

export type FinanceurType = "Banque" | "Agence" | "Fonds" | "Fondation" | "Investisseur" | "Donateur";
export interface Financeur { name: string; type: FinanceurType; description: string; country: string; scope: string; amount: string; sectors: string[]; }

export const financeurs: Financeur[] = [
  { name: "Banque Africaine de Développement (BAD)", type: "Banque", description: "Principale institution de financement du développement en Afrique.", country: "Côte d'Ivoire", scope: "Continental", amount: "12.6 milliards USD/an", sectors: ["Infrastructure", "Énergie", "Agriculture"] },
  { name: "Banque Mondiale (IDA/BIRD)", type: "Banque", description: "Plus grand bailleur multilatéral pour l'Afrique.", country: "International", scope: "International", amount: "30 milliards USD/an", sectors: ["Infrastructure", "Éducation", "Santé"] },
  { name: "Banque Européenne d'Investissement (BEI)", type: "Banque", description: "Bras financier de l'UE. Finance des projets climat et énergie renouvelable.", country: "Luxembourg", scope: "Europe", amount: "5 milliards EUR/an", sectors: ["Infrastructure", "Énergie", "Numérique"] },
  { name: "Banque Islamique de Développement (BID)", type: "Banque", description: "Finance des projets de développement dans les pays membres africains.", country: "Arabie Saoudite", scope: "International", amount: "4 milliards USD/an", sectors: ["Infrastructure", "Éducation", "Santé"] },
  { name: "BADEA", type: "Banque", description: "Institution arabe dédiée au financement du développement en Afrique subsaharienne.", country: "Soudan", scope: "International", amount: "1 milliard USD/an", sectors: ["Infrastructure", "Agriculture", "Énergie"] },
  { name: "Nouvelle Banque de Développement (NDB/BRICS)", type: "Banque", description: "Banque des BRICS finançant des projets d'infrastructure durable.", country: "Chine", scope: "International", amount: "3 milliards USD/an", sectors: ["Infrastructure", "Énergie", "Transport"] },
  { name: "Agence Française de Développement (AFD)", type: "Agence", description: "Principal opérateur de l'aide publique française.", country: "France", scope: "Europe", amount: "7 milliards EUR/an", sectors: ["Infrastructure", "Éducation", "Santé"] },
  { name: "USAID", type: "Agence", description: "Agence américaine pour le développement international.", country: "États-Unis", scope: "International", amount: "8 milliards USD/an", sectors: ["Santé", "Agriculture", "Éducation"] },
  { name: "GIZ / KfW (Allemagne)", type: "Agence", description: "Coopération technique et financière allemande.", country: "Allemagne", scope: "Europe", amount: "4 milliards EUR/an", sectors: ["Énergie", "Agriculture", "Éducation"] },
  { name: "Fondation Bill & Melinda Gates", type: "Fondation", description: "Première fondation privée mondiale investissant en Afrique.", country: "États-Unis", scope: "International", amount: "1.6 milliards USD/an", sectors: ["Santé", "Agriculture", "Éducation"] },
  { name: "Africa Finance Corporation (AFC)", type: "Fonds", description: "Institution financière panafricaine investissant dans les infrastructures.", country: "Nigeria", scope: "Continental", amount: "2 milliards USD", sectors: ["Infrastructure", "Énergie", "Transport"] },
  { name: "Proparco (Groupe AFD)", type: "Fonds", description: "Institution de financement du secteur privé en Afrique.", country: "France", scope: "Europe", amount: "2.5 milliards EUR/an", sectors: ["Énergie", "Numérique", "Finance"] },
];

export type AppelType = "Travaux" | "Fourniture" | "Services" | "Consultation" | "PPP";
export type AppelStatus = "Ouvert" | "En évaluation" | "Attribué" | "Clos" | "Annulé";
export interface AppelOffre { title: string; status: AppelStatus; description: string; country: string; agency: string; deadline: string; type: AppelType; sector: string; amount: string; }

export const appelsOffres: AppelOffre[] = [
  { title: "Construction du port en eau profonde d'El Hamdania – Lot Génie Civil", status: "Ouvert", description: "Appel d'offres international pour les travaux de génie civil du méga-port.", country: "Algérie", agency: "ANPM Algérie", deadline: "2024-07-30", type: "Travaux", sector: "Infrastructure", amount: "1.2 milliard USD" },
  { title: "Fourniture de turbines éoliennes – Parc de Tanger II", status: "Ouvert", description: "Fourniture et installation de 120 turbines éoliennes.", country: "Maroc", agency: "MASEN", deadline: "2024-08-15", type: "Fourniture", sector: "Énergie", amount: "320 millions USD" },
  { title: "Étude de faisabilité – Extension Canal de Suez logistique", status: "Attribué", description: "Mission de conseil pour l'extension de la zone logistique.", country: "Égypte", agency: "Suez Canal Authority", deadline: "2024-04-30", type: "Consultation", sector: "Transport", amount: "8 millions USD" },
  { title: "PPP Usine de dessalement – Grand Tunis", status: "Ouvert", description: "Partenariat public-privé pour usine de dessalement d'eau de mer.", country: "Tunisie", agency: "SONEDE", deadline: "2024-10-31", type: "PPP", sector: "Eau & Assainissement", amount: "450 millions USD" },
  { title: "Fourniture d'équipements médicaux – CHU Tripoli", status: "En évaluation", description: "Acquisition d'équipements hospitaliers modernes.", country: "Libye", agency: "Ministère de la Santé – Libye", deadline: "2024-06-15", type: "Fourniture", sector: "Santé", amount: "45 millions USD" },
  { title: "Réhabilitation réseau ferroviaire Nouakchott–Nouadhibou", status: "Ouvert", description: "Modernisation de la ligne ferroviaire minière.", country: "Mauritanie", agency: "SNIM", deadline: "2024-11-30", type: "Travaux", sector: "Transport", amount: "280 millions USD" },
  { title: "Construction autoroute Abidjan-Lagos – Tronçon CI", status: "En évaluation", description: "Travaux de construction du tronçon ivoirien de l'autoroute corridor.", country: "Côte d'Ivoire", agency: "AGEROUTE CI", deadline: "2024-06-30", type: "Travaux", sector: "Transport", amount: "800 millions USD" },
  { title: "Services d'ingénierie – Barrage de Souapiti Phase II", status: "Attribué", description: "Supervision des travaux de la phase II du barrage.", country: "Guinée", agency: "EDG – Guinée", deadline: "2024-07-10", type: "Services", sector: "Énergie", amount: "15 millions USD" },
  { title: "Fourniture de panneaux solaires – Programme Yeleen", status: "Ouvert", description: "Fourniture et installation de centrales solaires photovoltaïques.", country: "Burkina Faso", agency: "SONABEL", deadline: "2024-09-15", type: "Fourniture", sector: "Énergie", amount: "95 millions USD" },
];

export type StakeholderType = "Gouvernement" | "Entreprise" | "ONG" | "Institution" | "Partenaire technique" | "Bailleur";
export interface PartiesPrenantes { name: string; type: StakeholderType; description: string; country: string; role: string; sectors: string[]; projects: string[]; }

export const partiesPrenantes: PartiesPrenantes[] = [
  { name: "Ministère de l'Économie Numérique – Kenya", type: "Gouvernement", description: "Pilote le développement de Konza Technopolis et la stratégie numérique nationale.", country: "Kenya", role: "Maître d'ouvrage", sectors: ["Numérique", "Infrastructure"], projects: ["Konza Technopolis – Silicon Savannah"] },
  { name: "ANPT – Agence Nationale des Ports et Transports (Maroc)", type: "Gouvernement", description: "Supervise le développement portuaire de Tanger Med.", country: "Maroc", role: "Autorité de régulation", sectors: ["Transport", "Infrastructure"], projects: ["Centrale solaire Noor Ouarzazate"] },
  { name: "Ministère du Plan – RDC", type: "Gouvernement", description: "Coordonne les projets structurants dont le Grand Inga.", country: "RDC", role: "Maître d'ouvrage", sectors: ["Énergie", "Infrastructure"], projects: ["Barrage Grand Inga"] },
  { name: "NNPC – Nigerian National Petroleum Corporation", type: "Gouvernement", description: "Entreprise pétrolière nationale pilotant les projets énergétiques.", country: "Nigeria", role: "Opérateur public", sectors: ["Énergie", "Industrie"], projects: ["Réseau ferré léger d'Abuja"] },
  { name: "Commission de l'Union Africaine", type: "Institution", description: "Organe exécutif de l'UA coordonnant la ZLECAf et l'Agenda 2063.", country: "Continental", role: "Coordination continentale", sectors: ["Commerce", "Infrastructure"], projects: ["ZLECAf", "Agenda 2063"] },
  { name: "AUDA-NEPAD", type: "Institution", description: "Agence de développement de l'UA pour les infrastructures et la transformation agricole.", country: "Continental", role: "Agence de développement", sectors: ["Infrastructure", "Agriculture"], projects: ["PIDA", "CAADP"] },
  { name: "MASEN (Maroc)", type: "Gouvernement", description: "Agence marocaine pour l'énergie durable.", country: "Maroc", role: "Opérateur", sectors: ["Énergie"], projects: ["Noor Ouarzazate", "Parc éolien Tanger II"] },
  { name: "APIX (Sénégal)", type: "Gouvernement", description: "Agence de promotion des investissements et grands travaux.", country: "Sénégal", role: "Maître d'ouvrage délégué", sectors: ["Transport", "Infrastructure"], projects: ["TER Dakar"] },
  { name: "African Development Bank Group", type: "Bailleur", description: "Principal financeur multilatéral des projets de développement en Afrique.", country: "Continental", role: "Bailleur de fonds", sectors: ["Infrastructure", "Énergie", "Agriculture"], projects: ["PIDA", "Lobito Corridor"] },
  { name: "Banque Mondiale – IDA", type: "Bailleur", description: "Fournit des financements concessionnels aux pays africains à faible revenu.", country: "International", role: "Bailleur de fonds", sectors: ["Éducation", "Santé", "Infrastructure"], projects: ["BRT Abidjan", "Grand Inga"] },
];

// Dashboard stats
export const dashboardStats = {
  accords: 1247,
  programmes: 389,
  projets: 2156,
  financeurs: 70,
  partiesPrenantes: 70,
  pays: 54,
  montantTotal: "4.7 T USD",
};
