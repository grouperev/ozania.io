/**
 * ozania.io content: the DevOps console for Odoo.
 * Facts come from the company's own presentation (PDF) and www.ozania.io (FR/EN pages, 2026-10-16).
 * Anything not stated there is kept out; see CONTENT-NOTES.md.
 */

export const company = {
  name: 'Ozania.io',
  group: 'Ozania',
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || 'contact@ozania.com',
  phone: '+90 552 360 0708',
  phoneHref: 'tel:+905523600708',
  consoleUrl: 'https://www.ozania.io/web/login',
  servicesUrl: 'https://ozania.com',
  languages: 'français, arabe et anglais',
};

/* ------------------------------------------------------------------ */
/* Plans (prices from the live pricing page, in Algerian dinars).      */
/* ------------------------------------------------------------------ */

export type PlanId = 'discovery' | 'solo' | 'integrator' | 'agency';

export const plans: {
  id: PlanId; name: string; tagline: string; price: string; priceNote: string;
  features: string[]; highlight?: boolean;
}[] = [
  { id: 'discovery', name: 'Discovery', tagline: 'Construisez votre projet Odoo', price: 'Gratuit', priceNote: 'pendant 90 jours', features: ['Environnements de test et de pré-production', '1 client', 'Support communautaire'] },
  { id: 'solo', name: 'Solo', tagline: 'Pour un projet Odoo interne', price: '9 900 DA', priceNote: '1ʳᵉ année, puis 12 900 DA / an', features: ['1 client', '1 serveur', '1 production', 'Staging', 'Support standard'] },
  { id: 'integrator', name: 'Integrator', tagline: 'Pour gérer plusieurs clients Odoo', price: '19 900 DA', priceNote: '1ʳᵉ année, puis 24 900 DA / an', features: ['Multi-clients', 'Multi-serveurs', 'Multi-production', 'Multi-staging', 'Accès délégué pour l’IT de vos clients', 'Support prioritaire'], highlight: true },
  { id: 'agency', name: 'Agency', tagline: 'Toute votre clientèle, sous votre marque', price: '109 900 DA', priceNote: 'tarif forfaitaire / an', features: ['Multi-clients', 'Multi-serveurs', 'Multi-production', 'Multi-staging', 'Accès délégué pour l’IT de vos clients', 'Portail et domaine à votre marque', 'Support prioritaire'] },
];
export const planById = Object.fromEntries(plans.map((p) => [p.id, p])) as Record<PlanId, typeof plans[number]>;
export const isPlanId = (v: string | null): v is PlanId => !!v && v in planById;

export const comparison: { label: string; values: [string, string, string, string] }[] = [
  { label: 'Nombre d’instances', values: ['2', 'Illimité', 'Illimité', 'Illimité'] },
  { label: 'Nombre d’utilisateurs', values: ['Illimité', 'Illimité', 'Illimité', 'Illimité'] },
  { label: 'Modèle de facturation', values: ['Gratuit', 'Frais fixes', 'Frais fixes', 'Frais fixes'] },
  { label: 'Environnement de production', values: ['non', 'oui', 'oui', 'oui'] },
  { label: 'Serveur Ozania inclus', values: ['Optionnel', 'Optionnel', 'Optionnel', 'Optionnel'] },
  { label: 'Marque blanche', values: ['non', 'non', 'non', 'oui'] },
  { label: 'Idéal pour', values: ['Tests, démonstrations, pré-production', 'Projets internes', 'Intégrateurs', 'Intégrateurs, revendeurs'] },
];

/* ------------------------------------------------------------------ */
/* Plan finder (signature interaction).                                */
/* ------------------------------------------------------------------ */

export type Audience = 'test' | 'interne' | 'clients' | 'marque';
export type Hosting = 'cloud' | 'vps' | 'gere' | 'inconnu';

export const audiences: { id: Audience; label: string; hint: string }[] = [
  { id: 'test', label: 'Tester un projet', hint: 'Démonstration, preuve de concept, pré-production' },
  { id: 'interne', label: 'Mon entreprise', hint: 'Une instance Odoo interne à faire tourner' },
  { id: 'clients', label: 'Mes clients', hint: 'Vous êtes intégrateur et gérez plusieurs clients' },
  { id: 'marque', label: 'Mes clients, sous ma marque', hint: 'Agence ou revendeur avec son propre portail' },
];

export const hostings: { id: Hosting; label: string; detail: string }[] = [
  { id: 'cloud', label: 'Mon fournisseur cloud', detail: 'Connectez votre compte AWS, Azure, Hetzner ou DigitalOcean et déployez directement dessus.' },
  { id: 'vps', label: 'Mon VPS ou serveur dédié', detail: 'Pointez Ozania.io sur votre serveur via SSH. L’accès SSH complet reste le vôtre.' },
  { id: 'gere', label: 'Hébergement géré Ozania', detail: 'Ozania provisionne, met à jour et sécurise le serveur ; vous déployez depuis la même console.' },
  { id: 'inconnu', label: 'Pas encore décidé', detail: 'Toutes les options passent par la même console. Vous pourrez choisir, ou changer, plus tard.' },
];

export function recommend(audience: Audience | null, delegated: boolean): PlanId | null {
  if (!audience) return null;
  if (audience === 'test') return 'discovery';
  if (audience === 'marque') return 'agency';
  if (audience === 'clients') return 'integrator';
  return delegated ? 'integrator' : 'solo';
}

/* ------------------------------------------------------------------ */
/* Pipeline (home narrative).                                          */
/* ------------------------------------------------------------------ */

export const pipeline = [
  { id: 'push', label: 'Poussez', title: 'Votre code sur Git, ou un zip', text: 'Liez un module à son dépôt une fois pour toutes. Ensuite, un commit suffit.' },
  { id: 'staging', label: 'Staging', title: 'Un environnement complet, à part', text: 'Chaque modification part d’abord sur une instance de staging, distincte de la production.' },
  { id: 'valider', label: 'Validez', title: 'Rien ne part sans feu vert', text: 'Vous testez modules, flux et mises à jour avant de les déployer pour de bon.' },
  { id: 'production', label: 'Production', title: 'Mise à jour en un clic', text: 'Votre instance reçoit la nouvelle version sans que vous ayez à toucher au serveur.' },
];

/* ------------------------------------------------------------------ */
/* Platform.                                                           */
/* ------------------------------------------------------------------ */

export const problems = [
  { title: 'Chaque nouveau client ajoute des frais fixes.', text: 'Administration des serveurs, sauvegardes, surveillance : les mêmes heures, encore, pour chaque client, que vous en facturiez un ou vingt.' },
  { title: 'La hausse des coûts d’infrastructure réduit votre facture.', text: 'Quand la facture d’Odoo.sh augmente, c’est le budget de votre client qui la paie, et votre propre facture qui diminue.' },
  { title: 'Votre marque est absente de l’hébergement.', text: 'Vos clients voient le logo de votre hébergeur au lieu du vôtre. Une occasion de crédibilité perdue à chaque connexion.' },
];

export const deployOptions = [
  { id: 'cloud', label: 'Option 01', title: 'Votre fournisseur cloud', text: 'Connectez le compte AWS, Hetzner, Azure ou DigitalOcean que vous utilisez déjà et déployez directement dessus. Chaque instance, chaque région, suivie depuis un seul tableau de bord.' },
  { id: 'vps', label: 'Option 02', title: 'Votre VPS ou serveur dédié', text: 'Vous avez déjà un serveur ? Pointez Ozania.io dessus via SSH et gérez-le en quelques minutes. L’accès SSH complet reste à vous, rien n’est verrouillé.' },
  { id: 'gere', label: 'Option 03 · géré par nos soins', title: 'Hébergement géré Ozania', text: 'Aucune infrastructure à considérer. Nous provisionnons, appliquons les correctifs et sécurisons le serveur ; vous déployez depuis la même console, avec le même flux de travail.' },
];

/** Product capabilities, each illustrated by a real console screenshot or a photo. */
export const features = [
  {
    id: 'deploiement', group: 'Déploiement', title: 'Déployez partout.', lead: 'Toutes vos instances, tous vos sites, sur un seul écran.',
    text: 'Vos serveurs, ceux d’un client ou les nôtres en achat intégré. Vos environnements de production et de staging, répartis sur tous vos comptes cloud connectés, sont suivis depuis un tableau de bord unique.',
    image: '/images/ui/servers.webp', alt: 'Capture de la console Ozania.io : liste de serveurs chez Ozania, Hetzner, AWS, Azure, OVH, Hostinger et DigitalOcean, tous au statut Ready.', kind: 'ui', ratio: '1744 / 782',
  },
  {
    id: 'vps', group: 'Déploiement', title: 'Apportez votre propre serveur.', lead: 'Conservez un accès SSH complet.',
    text: 'Rien n’est verrouillé. Déployez, revenez à une version précédente ou inspectez un serveur exactement comme vous le faites déjà.',
    image: '/images/ui/server-hetzner.webp', alt: 'Capture de la console : fiche d’un serveur dédié Hetzner en Allemagne.', kind: 'ui', ratio: '1333 / 373',
  },
  {
    id: 'heberge', group: 'Déploiement', title: 'Ou utilisez nos serveurs gérés.', lead: 'Aucun compte cloud à ouvrir, aucun serveur à installer.',
    text: 'Nous provisionnons, appliquons les correctifs et sécurisons. Vous déployez depuis la même console que tout le reste, et ajoutez l’hébergement depuis votre tableau de bord à tout moment.',
    image: '/images/ui/managed-hosting.webp', alt: 'Capture de la console : fenêtre d’achat intégré d’un serveur géré Ozania.', kind: 'ui', ratio: '634 / 337',
  },
  {
    id: 'sauvegardes', group: 'Pipeline et sécurité', title: 'Chaque point de restauration, à un clic.', lead: 'Sauvegardes automatiques et redondantes.',
    text: 'Pour chaque instance gérée. Parcourez les points de restauration par date ou par serveur, et restaurez l’environnement d’un client en quelques secondes, sans export manuel ni fouille dans les espaces de stockage.',
    image: '/images/ui/backups.webp', alt: 'Capture de la console : gestionnaire de sauvegardes listant des archives de production et de staging avec boutons de téléchargement.', kind: 'ui', ratio: '1326 / 536',
  },
  {
    id: 'surveillance', group: 'Pipeline et sécurité', title: 'Gardez le contrôle.', lead: 'Surveillance en direct de chaque instance.',
    text: 'Disponibilité, processeur, mémoire et disque suivis sur l’ensemble de vos serveurs, pour qu’un problème apparaisse avant qu’un client ne s’en aperçoive.',
    image: '/images/team-console.webp', alt: 'Illustration : deux ingénieurs examinent un tableau de bord de serveurs sur deux grands écrans, dans un bureau lumineux aux rideaux violets.', kind: 'photo', ratio: '16 / 10',
  },
  {
    id: 'modules', group: 'Collaboration', title: 'Une bibliothèque de modules partagée.', lead: 'Chargez un module une fois, déployez-le partout.',
    text: 'Vos modules validés sont centralisés et installables en un clic sur l’instance de n’importe quel client. Plus besoin d’importer le même zip ni de re-cloner le même dépôt.',
    image: '/images/ui/addons.webp', alt: 'Capture de la console : bibliothèque de modules Odoo partagés, chacun avec la liste des instances où il est installé.', kind: 'ui', ratio: '1326 / 536',
  },
  {
    id: 'git', group: 'Collaboration', title: 'Poussez sur Git. Cliquez sur Mettre à jour.', lead: 'Les mises à jour de modules en deux gestes.',
    text: 'Liez une fois un module à votre dépôt Git. Ensuite, poussez votre commit puis cliquez sur Mettre à jour : votre instance Odoo reçoit la nouvelle version, sans toucher au serveur.',
    image: '/images/ui/git-update.webp', alt: 'Capture de la console : module relié à un dépôt Git avec un bouton de mise à jour.', kind: 'ui', ratio: '1298 / 213',
  },
  {
    id: 'acces', group: 'Collaboration', title: 'L’IT de votre client, sur son propre serveur.', lead: 'Accès délégué, à votre manière.',
    text: 'Accordez à l’équipe d’un client un accès limité à sa propre instance (sauvegardes, redémarrages, journaux) pour qu’elle se serve elle-même. Vous n’avez plus à le faire pour chaque client.',
    image: '/images/team-client-call.webp', alt: 'Illustration : une intégratrice échange en visioconférence avec le responsable informatique d’un client, devant un tableau de bord de restauration.', kind: 'photo', ratio: '1216 / 1368',
  },
  {
    id: 'marque', group: 'Évolutivité', title: 'Votre nom à chaque connexion.', lead: 'Marque blanche pour les agences.',
    text: 'Les agences obtiennent leur propre portail et leur propre domaine. Vos clients voient votre logo, pas le nôtre. Disponible avec le plan Agency.',
    image: '/images/team-release.webp', alt: 'Illustration : une équipe d’intégrateurs suit sur un écran mural le passage d’une mise à jour du staging à la production.', kind: 'photo', ratio: '16 / 9',
  },
] as const;

export const capabilityGroups = [
  { label: 'Déploiement', items: ['Apportez votre propre serveur', 'Hébergement géré Ozania'] },
  { label: 'Collaboration', items: ['Bibliothèque d’addons partagée', 'Accès délégué pour les équipes IT'] },
  { label: 'Pipeline et sécurité', items: ['Staging', 'Sauvegardes', 'Restauration', 'Surveillance'] },
  { label: 'Évolutivité', items: ['Marque blanche'] },
];

export const benefits = [
  { title: 'Validez chaque modification', text: 'Chaque déploiement passe d’abord par le staging : rien ne part en production sans feu vert.' },
  { title: 'Bibliothèque de modules', text: 'Vos modules validés, prêts à être installés chez n’importe lequel de vos clients.' },
  { title: 'Déployez partout', text: 'Sur n’importe quel cloud, le vôtre ou le nôtre. Entièrement automatisé.' },
  { title: 'Gardez le contrôle', text: 'Processeur, mémoire, disque et disponibilité suivis en direct sur tous vos serveurs.' },
  { title: 'Modules en ligne en moins d’une minute', text: 'Poussez un module en zip ou directement depuis Git.' },
  { title: 'Sauvegardes automatiques', text: 'Périodiques, sur stockage redondant, restaurables en quelques clics.' },
  { title: 'Accès délégué', text: 'Un accès autonome et limité à remettre à l’IT de n’importe quel client.' },
  { title: 'Portail en marque blanche', text: 'Votre domaine et votre image, avec le plan Agency.' },
];

export const providers = ['AWS', 'Microsoft Azure', 'Hetzner', 'OVHcloud', 'DigitalOcean', 'Hostinger', 'Votre VPS', 'Serveurs Ozania'];
export const stack = ['Git', 'GitHub', 'Docker', 'PostgreSQL', 'Ubuntu', 'Grafana', 'Prometheus', 'cAdvisor'];

/* ------------------------------------------------------------------ */
/* FAQ (from the live pricing page) and search.                        */
/* ------------------------------------------------------------------ */

export const faqs: [string, string][] = [
  ['Qu’est-ce qu’Ozania.io, exactement ?', 'Une couche de gestion pour vos instances Odoo : déploiement, sauvegardes, mises à niveau, environnements de staging et surveillance depuis une interface unique. Vos serveurs restent sous votre contrôle.'],
  ['Ozania.io héberge-t-il mes instances Odoo ?', 'Non, pas par défaut. Vous connectez vos propres serveurs, chez le fournisseur de votre choix, et la plateforme les gère. L’hébergement géré Ozania est une option.'],
  ['En quoi est-ce différent d’Odoo.sh ?', 'Odoo.sh facture en fonction de l’utilisation et fonctionne sur sa propre infrastructure. Ozania.io repose sur un abonnement fixe, indépendant du nombre d’utilisateurs, et vous décidez où tournent vos serveurs.'],
  ['Pour qui est-ce ?', 'Les intégrateurs Odoo et les petites agences, ainsi que les entreprises qui veulent gérer leur propre instance sans équipe DevOps dédiée.'],
  ['Quelles versions et éditions d’Odoo sont prises en charge ?', 'Odoo 17, 18, 19 et 20, en éditions Community et Enterprise.'],
  ['Le prix dépend-il du nombre d’utilisateurs ?', 'Non. Le prix dépend de votre plan, pas du nombre d’utilisateurs.'],
  ['La licence Odoo Enterprise est-elle incluse ?', 'Non. La licence reste entre le client final et Odoo. Ozania ne la revend pas.'],
  ['Combien coûteront les serveurs en plus de l’abonnement ?', 'Cela dépend de votre fournisseur et de la taille de votre instance. L’équipe peut vous aider à l’estimer pour votre cas.'],
  ['Le plan Discovery est-il vraiment gratuit ?', 'Oui. Sa seule limite est sa durée : il convient aux projets d’une durée de vie allant jusqu’à trois mois.'],
  ['Puis-je changer de plan ou résilier à tout moment ?', 'Oui, à la fin de chaque période d’abonnement.'],
  ['Où mes données sont-elles stockées ?', 'Sur vos propres serveurs. La plateforme n’héberge pas vos bases de données.'],
  ['Comment mes identifiants de serveur sont-ils protégés ?', 'Les secrets sont chiffrés, l’accès repose sur des rôles et les actions sont journalisées.'],
  ['Que se passe-t-il si j’arrête d’utiliser Ozania.io ?', 'Vos instances continuent de fonctionner. Elles restent sur vos serveurs, avec vos sauvegardes.'],
  ['Qu’est-ce qu’une instance de staging ?', 'Un environnement Odoo complet, distinct de la production, pour tester modules, flux et mises à jour avant leur déploiement réel.'],
  ['Combien de temps faut-il pour connecter un premier serveur ?', 'Quelques secondes.'],
  ['Quel support est inclus ?', 'Cela dépend de votre plan. Le support est assuré par e-mail en français, arabe et anglais, et via WhatsApp pour le support prioritaire.'],
  ['Proposez-vous aussi le développement et le support Odoo ?', 'Oui, à travers Ozania.com, la société du groupe dédiée aux projets Odoo.'],
];
export const homeFaqs = [0, 2, 1, 4, 10].map((i) => faqs[i]);

export type SearchEntry = { title: string; path: string; description: string; kind: string };

export const searchIndex: SearchEntry[] = [
  { kind: 'Page', title: 'Accueil', path: '/', description: 'Console DevOps pour Odoo, déploiement, staging, production' },
  { kind: 'Page', title: 'La plateforme', path: '/plateforme', description: 'Options de déploiement, sauvegardes, modules, Git, accès délégué, marque blanche' },
  { kind: 'Page', title: 'Tarifs', path: '/tarifs', description: 'Discovery, Solo, Integrator, Agency, comparatif, questions fréquentes' },
  { kind: 'Page', title: 'À propos', path: '/a-propos', description: 'Équipe DevOps, groupe Ozania, certifications Odoo, support' },
  { kind: 'Page', title: 'Contact', path: '/contact', description: 'Demander un compte, e-mail, téléphone, question' },
  { kind: 'Page', title: 'Confidentialité', path: '/confidentialite', description: 'Données personnelles, formulaire, cookies' },
  ...plans.map((p) => ({ kind: 'Plan', title: `${p.name} · ${p.price}`, path: `/tarifs#plan-${p.id}`, description: `${p.tagline}. ${p.features.join(', ')}` })),
  ...features.map((f) => ({ kind: 'Plateforme', title: f.title, path: `/plateforme#${f.id}`, description: `${f.group}. ${f.lead}` })),
  ...deployOptions.map((o) => ({ kind: 'Déploiement', title: o.title, path: '/plateforme#options', description: o.text })),
  ...faqs.map(([q, a]) => ({ kind: 'Question', title: q, path: '/tarifs#questions', description: a })),
];
