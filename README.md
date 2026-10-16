# ozania.io

Site vitrine de ozania.io, société du groupe Ozania dédiée à l’intégration d’Odoo pour les entreprises. Site français, responsive, en préversion : l’indexation est désactivée (`noindex, nofollow`) et rien n’est déployé.

## Stack

React 19, TypeScript, Vite, React Router, GSAP + Lenis sur une seule horloge (le défilement fluide est désactivé en mouvement réduit), icônes Phosphor, polices locales Fontsource (Manrope, Space Grotesk). Aucune requête vers un service tiers.

Node 22 et plus fonctionne ; la référence du groupe recommande Node 24.

## Commandes

```sh
npm ci                          # installation
npm run dev -- --port 4180      # développement
npm run build                   # tsc -b puis build Vite (dist/)
npm run preview -- --port 4181  # sert dist/
npm run test:e2e                # scripts/verify.mjs (parcours navigateur, serveur de preview requis)
npm run export:preview          # build + exports/ozania-io-preview.html
npm run test:preview            # vérifie l’aperçu autonome via file://
```

## Routes

`/`, `/expertise-odoo`, `/accompagnement`, `/vos-enjeux` (sélecteur de besoins), `/a-propos`, `/contact`, `/confidentialite`. Toute autre adresse affiche la page 404.

## Formulaire de contact : comportement réel

**Mode brouillon (défaut).** Rien n’est envoyé. Le visiteur prépare sa demande, puis la copie ou la télécharge. Aucune donnée personnelle n’est conservée dans `localStorage` ni dans des cookies. Si `VITE_CONTACT_EMAIL` est renseigné, un bouton ouvre en plus la messagerie du visiteur (`mailto`).

**Mode `api` (optionnel).** Avec `VITE_CONTACT_DELIVERY=api`, le formulaire appelle `POST /api/contact` (`api/contact.ts`, fonction serverless, envoi via Resend en `fetch`). Le succès n’est affiché que si la réponse contient `delivered: true`. Variables serveur, toutes requises :

- `RESEND_API_KEY` : secret, à saisir dans les paramètres sécurisés de l’hébergeur ;
- `CONTACT_FROM_EMAIL` : expéditeur vérifié chez le fournisseur ;
- `CONTACT_TO_EMAIL` : destinataire.

Si l’une manque, la fonction répond 503 `{ delivered: false, reason: 'not-configured' }` et le site retombe sur le brouillon. Il n’existe aucun destinataire par défaut, et le visiteur ne peut choisir ni le destinataire ni l’expéditeur (son e-mail sert uniquement de `reply_to`).

**Le destinataire d’ozania.io n’est pas confirmé.** Tant qu’il ne l’est pas, ne rien renseigner dans `CONTACT_TO_EMAIL` ni `VITE_CONTACT_EMAIL`. Voir `.env.example` (noms et commentaires uniquement, aucune valeur).

## Prévisualisation autonome

```sh
npm run export:preview
npm run test:preview
```

Produit `exports/ozania-io-preview.html` : un seul fichier avec CSS, JavaScript, polices et images embarqués, sans requête réseau. Ouvrez-le directement dans un navigateur (`file://`). La navigation utilise le routage par hash (`#/vos-enjeux`, `#/contact`…) grâce à `<meta name="oz-preview" content="standalone">`. Une copie statique de l’accueil est incluse : un lecteur qui bloque les scripts voit donc la page, pas un écran vide. Le formulaire y reste en mode brouillon.

## Déploiement

Rien n’a été déployé. Tout déploiement doit passer par un projet de préversion dédié à ozania.io et confirmé, jamais par le projet Vercel de la société mère ni par une production.

## Documents associés

- `DESIGN.md` : direction de design
- `design-qa.md` : contrôles qualité du design
- `CONTENT-NOTES.md` : notes et provenance des contenus
