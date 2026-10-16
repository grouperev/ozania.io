/**
 * ozania.io content. Business facts that are not yet confirmed are listed in
 * CONTENT-NOTES.md; the copy below stays neutral and avoids commitments.
 */

export const company = {
  name: 'ozania.io',
  group: 'Ozania',
  /** Unconfirmed: no recipient is set until the company supplies one. */
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || '',
};

/* ------------------------------------------------------------------ */
/* Odoo applications and the flows between them (signature selector). */
/* ------------------------------------------------------------------ */

export type AppId =
  | 'crm' | 'ecommerce' | 'pdv' | 'assistance'
  | 'ventes' | 'achats' | 'inventaire' | 'fabrication' | 'projet' | 'feuilles'
  | 'facturation' | 'comptabilite' | 'employes' | 'conges';

export const lanes = [
  { id: 'relation', label: 'Relation client', hint: 'Là où commence la demande' },
  { id: 'operations', label: 'Opérations', hint: 'Là où le travail se fait' },
  { id: 'gestion', label: 'Gestion', hint: 'Là où tout se retrouve' },
] as const;
export type LaneId = typeof lanes[number]['id'];

export const apps: { id: AppId; name: string; lane: LaneId; role: string }[] = [
  { id: 'crm', name: 'CRM', lane: 'relation', role: 'Prospects, opportunités et relances' },
  { id: 'ecommerce', name: 'eCommerce', lane: 'relation', role: 'Boutique en ligne reliée au catalogue' },
  { id: 'pdv', name: 'Point de vente', lane: 'relation', role: 'Caisse en boutique' },
  { id: 'assistance', name: 'Assistance', lane: 'relation', role: 'Demandes et tickets clients' },
  { id: 'ventes', name: 'Ventes', lane: 'operations', role: 'Devis, commandes et tarifs' },
  { id: 'achats', name: 'Achats', lane: 'operations', role: 'Demandes de prix et commandes fournisseurs' },
  { id: 'inventaire', name: 'Inventaire', lane: 'operations', role: 'Stock, entrepôts et mouvements' },
  { id: 'fabrication', name: 'Fabrication', lane: 'operations', role: 'Nomenclatures et ordres de production' },
  { id: 'projet', name: 'Projet', lane: 'operations', role: 'Tâches, étapes et échéances' },
  { id: 'feuilles', name: 'Feuilles de temps', lane: 'operations', role: 'Temps passé par tâche' },
  { id: 'facturation', name: 'Facturation', lane: 'gestion', role: 'Factures, avoirs et paiements' },
  { id: 'comptabilite', name: 'Comptabilité', lane: 'gestion', role: 'Écritures, rapprochements et rapports' },
  { id: 'employes', name: 'Employés', lane: 'gestion', role: 'Fiches et organisation des équipes' },
  { id: 'conges', name: 'Congés', lane: 'gestion', role: 'Demandes et validation des absences' },
];
export const appById = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, typeof apps[number]>;

/** Typical Odoo flows. Exact behaviour depends on configuration and edition. */
export const flows: { from: AppId; to: AppId; label: string }[] = [
  { from: 'crm', to: 'ventes', label: 'l’opportunité devient un devis' },
  { from: 'ecommerce', to: 'ventes', label: 'la commande en ligne arrive dans les ventes' },
  { from: 'ecommerce', to: 'inventaire', label: 'le stock disponible se reflète en ligne' },
  { from: 'pdv', to: 'inventaire', label: 'chaque vente en caisse sort du stock' },
  { from: 'assistance', to: 'crm', label: 'le ticket garde l’historique du client' },
  { from: 'ventes', to: 'inventaire', label: 'la commande prépare la livraison' },
  { from: 'ventes', to: 'projet', label: 'un service vendu peut ouvrir un projet' },
  { from: 'achats', to: 'inventaire', label: 'la réception met le stock à jour' },
  { from: 'inventaire', to: 'fabrication', label: 'les composants alimentent la production' },
  { from: 'projet', to: 'feuilles', label: 'le temps se saisit sur la tâche' },
  { from: 'ventes', to: 'facturation', label: 'la commande devient facture' },
  { from: 'feuilles', to: 'facturation', label: 'le temps passé peut être facturé' },
  { from: 'achats', to: 'comptabilite', label: 'la facture fournisseur rejoint la comptabilité' },
  { from: 'pdv', to: 'comptabilite', label: 'les sessions de caisse sont comptabilisées' },
  { from: 'facturation', to: 'comptabilite', label: 'la facture est comptabilisée' },
  { from: 'employes', to: 'conges', label: 'les absences suivent la fiche de chacun' },
  { from: 'employes', to: 'feuilles', label: 'le temps est rattaché à chaque personne' },
];

export const needGroups = [
  { id: 'clients', label: 'Clients et ventes' },
  { id: 'flux', label: 'Stock, achats et production' },
  { id: 'services', label: 'Projets et services' },
  { id: 'finance', label: 'Finance' },
  { id: 'equipes', label: 'Équipes' },
] as const;

export type NeedId =
  | 'prospects' | 'devis' | 'enligne' | 'caisse' | 'sav'
  | 'stock' | 'achats' | 'production' | 'projets' | 'facturation' | 'compta' | 'equipes';

export const needs: { id: NeedId; group: typeof needGroups[number]['id']; label: string; pain: string; apps: AppId[] }[] = [
  { id: 'prospects', group: 'clients', label: 'Suivre prospects et opportunités', pain: 'Les relances dépendent de la mémoire de chacun.', apps: ['crm'] },
  { id: 'devis', group: 'clients', label: 'Établir devis et commandes', pain: 'Les devis sont refaits à la main à partir d’un modèle.', apps: ['ventes'] },
  { id: 'enligne', group: 'clients', label: 'Vendre en ligne', pain: 'La boutique et le stock ne racontent pas la même chose.', apps: ['ecommerce', 'ventes', 'inventaire'] },
  { id: 'caisse', group: 'clients', label: 'Encaisser en boutique', pain: 'Les ventes du jour sont ressaisies le soir.', apps: ['pdv', 'inventaire'] },
  { id: 'sav', group: 'clients', label: 'Traiter les demandes clients', pain: 'Les demandes se perdent entre e-mails et appels.', apps: ['assistance', 'crm'] },
  { id: 'stock', group: 'flux', label: 'Connaître le stock réel', pain: 'Il faut aller vérifier en réserve avant de répondre.', apps: ['inventaire'] },
  { id: 'achats', group: 'flux', label: 'Organiser les achats fournisseurs', pain: 'Les commandes fournisseurs vivent dans un tableur.', apps: ['achats', 'inventaire'] },
  { id: 'production', group: 'flux', label: 'Planifier la production', pain: 'Les besoins en composants arrivent trop tard.', apps: ['fabrication', 'inventaire', 'achats'] },
  { id: 'projets', group: 'services', label: 'Piloter projets et temps passé', pain: 'Le temps réellement passé reste une estimation.', apps: ['projet', 'feuilles'] },
  { id: 'facturation', group: 'finance', label: 'Facturer sans ressaisie', pain: 'Chaque facture recopie une commande existante.', apps: ['facturation'] },
  { id: 'compta', group: 'finance', label: 'Suivre comptabilité et trésorerie', pain: 'La situation financière arrive avec plusieurs semaines de retard.', apps: ['comptabilite', 'facturation'] },
  { id: 'equipes', group: 'equipes', label: 'Gérer employés et absences', pain: 'Les congés se valident par messages dispersés.', apps: ['employes', 'conges'] },
];
export const needById = Object.fromEntries(needs.map((need) => [need.id, need])) as Record<NeedId, typeof needs[number]>;
export const isNeedId = (value: string): value is NeedId => value in needById;

export function scopeFor(selected: readonly NeedId[]) {
  const appIds = new Set<AppId>();
  selected.forEach((id) => needById[id]?.apps.forEach((app) => appIds.add(app)));
  const activeFlows = flows.filter((flow) => appIds.has(flow.from) && appIds.has(flow.to));
  return { apps: apps.filter((app) => appIds.has(app.id)), flows: activeFlows };
}

/* ------------------------------------------------------------------ */
/* Example sectors: starting points, not a claim of references.        */
/* ------------------------------------------------------------------ */

export const sectors: { id: string; title: string; intro: string; text: string; needs: NeedId[]; image: string; alt: string }[] = [
  {
    id: 'negoce', title: 'Négoce et distribution', intro: 'Des commandes, des fournisseurs et un stock qui doivent rester alignés.',
    text: 'Quand le commercial promet une date, il doit voir le stock réel et les achats en cours. Ventes, Achats et Inventaire partagent alors les mêmes articles, et la facture part de la commande.',
    needs: ['prospects', 'devis', 'stock', 'achats', 'facturation', 'compta'],
    image: '/images/team-stock.webp', alt: 'Illustration : deux collègues vérifient des rayonnages de cartons dans une réserve voûtée et lumineuse.',
  },
  {
    id: 'industrie', title: 'Industrie et production', intro: 'Une information partagée, de la commande client à l’atelier.',
    text: 'Une commande déclenche des besoins en composants, des achats et des ordres de production. Relier ces étapes évite de découvrir un manque au dernier moment.',
    needs: ['devis', 'stock', 'achats', 'production', 'compta'],
    image: '/images/team-workshop.webp', alt: 'Illustration : une équipe dessine un enchaînement de processus sur un mur blanc, sous des arches voilées de violet.',
  },
  {
    id: 'services', title: 'Services et conseil', intro: 'Du premier contact à la facture, gardez le fil de chaque mission.',
    text: 'L’opportunité devient un devis, le devis signé ouvre un projet, le temps passé alimente la facture. Chaque étape reprend la précédente au lieu de la recopier.',
    needs: ['prospects', 'devis', 'projets', 'facturation', 'equipes'],
    image: '/images/team-training.webp', alt: 'Illustration : une collègue explique un écran à deux personnes assises autour d’une table claire.',
  },
  {
    id: 'commerce', title: 'Commerce et vente au détail', intro: 'Boutique, site et réserve qui parlent du même stock.',
    text: 'Caisse et boutique en ligne puisent dans un inventaire commun. Les réassorts se préparent à partir des ventes réelles, et les sessions de caisse rejoignent la comptabilité.',
    needs: ['caisse', 'enligne', 'stock', 'achats', 'compta'],
    image: '/images/team-commerce.webp', alt: 'Illustration : une équipe prépare des colis sur un plan de travail, devant de hautes arches blanches.',
  },
];

/* ------------------------------------------------------------------ */
/* Services: proposed content categories, not contractual commitments. */
/* ------------------------------------------------------------------ */

export const services = [
  {
    id: 'cadrage', title: 'Cadrage et conseil', lead: 'Comprendre avant de configurer.',
    text: 'Nous partons de votre organisation : qui fait quoi, avec quels documents, à quel moment. Ce travail permet de choisir les applications utiles, de fixer des priorités et de définir un périmètre de départ réaliste.',
    items: ['Entretiens avec les personnes concernées', 'Cartographie des processus actuels', 'Priorités et périmètre de départ', 'Points d’attention repérés tôt'],
    image: '/images/team-workshop.webp', alt: 'Illustration : atelier de cartographie des processus devant un mur blanc.',
  },
  {
    id: 'parametrage', title: 'Mise en place et paramétrage', lead: 'Un Odoo qui parle votre langage.',
    text: 'Les applications retenues sont configurées selon vos règles : étapes de vente, circuits de validation, catalogues, taxes, droits d’accès. L’outil s’adapte à votre façon de travailler, plutôt que l’inverse.',
    items: ['Configuration des applications retenues', 'Règles, étapes et validations', 'Rôles et droits d’accès', 'Tests avec vos situations réelles'],
    image: '/images/team-collaboration.webp', alt: 'Illustration : quatre collègues travaillent autour d’un ordinateur sur une grande table claire.',
  },
  {
    id: 'migration', title: 'Migration et reprise de données', lead: 'Repartir avec des données fiables.',
    text: 'Clients, articles, fournisseurs, soldes : les données existantes sont analysées, nettoyées puis importées. Si vous utilisez déjà Odoo, nous étudions avec vous le passage vers la version visée.',
    items: ['Inventaire des sources existantes', 'Nettoyage et correspondance des champs', 'Imports de contrôle avant la bascule', 'Étude d’une montée de version'],
    image: '/images/team-stock.webp', alt: 'Illustration : deux collègues contrôlent des rayonnages avec une tablette.',
  },
  {
    id: 'connexions', title: 'Connexions et intégrations', lead: 'Relier Odoo au reste de votre activité.',
    text: 'Certains outils restent en place : banque, boutique en ligne, logiciel métier, fichiers partagés. Nous étudions comment les faire dialoguer avec Odoo, par un connecteur existant ou un échange de données adapté, selon ce qui est faisable et utile.',
    items: ['Étude de faisabilité de chaque liaison', 'Connecteurs existants quand ils conviennent', 'Échanges de données adaptés', 'Contrôle des flux après mise en service'],
    image: '/images/team-commerce.webp', alt: 'Illustration : une équipe prépare des commandes à expédier.',
  },
  {
    id: 'formation', title: 'Formation et adoption', lead: 'Des équipes à l’aise avec leur outil.',
    text: 'Chaque équipe apprend sur ses propres tâches, avec ses propres données. Sessions par rôle, supports simples et accompagnement au démarrage : l’adoption se prépare autant que la configuration.',
    items: ['Sessions organisées par rôle', 'Exercices sur vos cas réels', 'Supports de prise en main', 'Accompagnement des premiers jours'],
    image: '/images/team-training.webp', alt: 'Illustration : une formatrice montre un écran à deux collègues attentifs.',
  },
  {
    id: 'suivi', title: 'Suivi et évolution', lead: 'Faire grandir votre Odoo pas à pas.',
    text: 'Après le démarrage, les usages évoluent. Nous restons disponibles pour ajuster les réglages, répondre aux questions et préparer les étapes suivantes, à votre rythme.',
    items: ['Ajustements après démarrage', 'Réponses aux questions des équipes', 'Ajout progressif d’applications', 'Préparation des évolutions'],
    image: '/images/team-low-angle.webp', alt: 'Illustration : des collègues échangent autour d’une tablette près d’une fenêtre en arche.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Implementation journey.                                             */
/* ------------------------------------------------------------------ */

export const phases = [
  {
    id: 'comprendre', label: 'Comprendre', title: 'Comprendre votre quotidien.',
    text: 'Un premier échange, puis des entretiens avec les personnes qui vivent les processus. Nous observons ce qui fonctionne déjà et ce qui ralentit vos équipes.',
    together: ['Entretiens par équipe', 'Revue des documents et fichiers utilisés'],
    you: ['Désigner un référent projet', 'Partager des exemples réels : devis, factures, fichiers'],
    result: 'Une vision partagée des priorités et un périmètre de départ.',
  },
  {
    id: 'concevoir', label: 'Concevoir', title: 'Dessiner la cible.',
    text: 'Vos besoins deviennent des applications, des étapes et des règles. Chaque choix est expliqué en termes métier, pour que la décision vous appartienne.',
    together: ['Choix des applications', 'Circuits de validation et rôles'],
    you: ['Valider les règles métier', 'Arbitrer les priorités'],
    result: 'Une description claire de ce qui sera mis en place, et de ce qui peut attendre.',
  },
  {
    id: 'construire', label: 'Construire', title: 'Configurer et vérifier.',
    text: 'Le paramétrage avance par étapes courtes. Vos données sont importées et vos cas réels servent de tests, avant toute mise en service.',
    together: ['Paramétrage et imports de données', 'Liaisons avec vos autres outils'],
    you: ['Tester avec vos situations réelles', 'Signaler ce qui doit être ajusté'],
    result: 'Un Odoo configuré et vérifié avec vos propres exemples.',
  },
  {
    id: 'demarrer', label: 'Démarrer', title: 'Former, puis basculer.',
    text: 'Les équipes sont formées sur leurs tâches, puis la date de démarrage est choisie avec vous. Les premiers jours sont suivis de près.',
    together: ['Formation par rôle', 'Préparation de la bascule'],
    you: ['Libérer du temps pour la formation', 'Fixer la date de démarrage'],
    result: 'Des équipes prêtes et un démarrage préparé.',
  },
  {
    id: 'faire-vivre', label: 'Faire vivre', title: 'Ajuster et faire grandir.',
    text: 'Les premières semaines font apparaître de nouveaux besoins. Nous ajustons, répondons aux questions et préparons la suite, application après application.',
    together: ['Ajustements après démarrage', 'Bilan des usages'],
    you: ['Faire remonter les retours des équipes', 'Choisir les prochaines étapes'],
    result: 'Un outil qui suit l’évolution de votre entreprise.',
  },
] as const;

export const principles = [
  { title: 'Commencer par l’essentiel', text: 'Un premier périmètre utile vaut mieux qu’un projet trop large. Le reste peut suivre.' },
  { title: 'Décider avec vous', text: 'Chaque option est expliquée en termes métier. Les arbitrages restent les vôtres.' },
  { title: 'Tester avec du réel', text: 'Vos devis, vos articles et vos cas particuliers servent de référence avant la mise en service.' },
  { title: 'Transmettre', text: 'L’objectif est votre autonomie : comprendre l’outil, et pas seulement l’utiliser.' },
];

/* Scattered tools that Odoo can gather (home narrative). */
export const fragments: { before: string; app: string }[] = [
  { before: 'Le fichier clients partagé', app: 'CRM' },
  { before: 'Les devis en traitement de texte', app: 'Ventes' },
  { before: 'Le tableur des stocks', app: 'Inventaire' },
  { before: 'Les commandes fournisseurs par e-mail', app: 'Achats' },
  { before: 'Les factures ressaisies', app: 'Facturation' },
  { before: 'Le planning sur tableau blanc', app: 'Projet' },
];

/* ------------------------------------------------------------------ */
/* FAQ and search.                                                     */
/* ------------------------------------------------------------------ */

export const generalFaqs: [string, string][] = [
  ['Odoo convient-il à une entreprise de notre taille ?', 'Odoo est modulaire : on peut commencer avec quelques applications, puis en ajouter. Le cadrage sert justement à vérifier l’adéquation avec votre activité avant tout engagement.'],
  ['Faut-il tout changer en une seule fois ?', 'Non. Il est souvent plus simple de démarrer avec un périmètre limité, puis de l’étendre. Le sélecteur de la page Vos enjeux vous aide à repérer un point de départ.'],
  ['Nous utilisons déjà Odoo. Pouvez-vous reprendre notre projet ?', 'Nous pouvons étudier votre configuration actuelle, vos besoins et une éventuelle montée de version. Décrivez votre situation dans le formulaire de contact.'],
  ['Combien de temps dure un projet ?', 'Cela dépend du périmètre, des données à reprendre et de la disponibilité de vos équipes. Une estimation réaliste se construit après le cadrage, pas avant.'],
];

export const journeyFaqs: [string, string][] = [
  ['Qui doit participer côté entreprise ?', 'Un référent projet, puis les personnes qui connaissent chaque processus. Leur temps est surtout sollicité pendant le cadrage, les tests et la formation.'],
  ['Pouvons-nous démarrer avec une seule équipe ?', 'Oui. Un démarrage progressif, par équipe ou par application, réduit les risques et permet d’apprendre avant d’étendre.'],
  ['Quelle édition d’Odoo choisir ?', 'Certaines applications ne sont disponibles que dans l’édition Enterprise. Le choix dépend des applications utiles à votre activité ; nous l’examinons ensemble pendant le cadrage.'],
  ['Que se passe-t-il après le démarrage ?', 'Les premières semaines servent à ajuster les réglages et à répondre aux questions. Les évolutions suivantes se planifient ensuite, à votre rythme.'],
];

export type SearchEntry = { title: string; path: string; description: string; kind: string };

export const searchIndex: SearchEntry[] = [
  { kind: 'Page', title: 'Accueil', path: '/', description: 'Intégration Odoo, vue d’ensemble, processus connectés' },
  { kind: 'Page', title: 'Expertise Odoo', path: '/expertise-odoo', description: 'Cadrage, paramétrage, migration, connexions, formation, suivi' },
  { kind: 'Page', title: 'Notre accompagnement', path: '/accompagnement', description: 'Étapes du projet, méthode, démarrage, adoption' },
  { kind: 'Page', title: 'Vos enjeux', path: '/vos-enjeux', description: 'Besoins, secteurs, périmètre de départ, applications Odoo' },
  { kind: 'Page', title: 'À propos', path: '/a-propos', description: 'ozania.io, groupe Ozania, valeurs, façon de travailler' },
  { kind: 'Page', title: 'Contact', path: '/contact', description: 'Préparer une demande, projet, devis, rendez-vous' },
  { kind: 'Page', title: 'Confidentialité', path: '/confidentialite', description: 'Données personnelles, formulaire, cookies' },
  ...services.map((s) => ({ kind: 'Expertise', title: s.title, path: `/expertise-odoo#${s.id}`, description: `${s.lead} ${s.items.join(', ')}` })),
  ...phases.map((p, i) => ({ kind: 'Étape', title: `${String(i + 1).padStart(2, '0')} · ${p.label}`, path: `/accompagnement?etape=${p.id}#etapes`, description: p.title + ' ' + p.text })),
  ...sectors.map((s) => ({ kind: 'Secteur', title: s.title, path: `/vos-enjeux?secteur=${s.id}#secteurs`, description: s.intro })),
  ...apps.map((a) => ({ kind: 'Application Odoo', title: a.name, path: '/vos-enjeux#selecteur', description: a.role })),
];
