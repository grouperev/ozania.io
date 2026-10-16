# ozania.io

Site vitrine d’Ozania.io, la console DevOps pour Odoo (société du groupe Ozania) : déploiement, staging, sauvegardes, surveillance, bibliothèque de modules, accès délégué et marque blanche. Site français, responsive. L’indexation reste désactivée (`noindex, nofollow`) jusqu’à la validation des mentions légales. Déployé sur le projet Vercel dédié « ozania.io » via la branche `main` de `grouperev/ozania.io`.

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

`/`, `/plateforme`, `/tarifs` (plans, assistant de choix, comparatif, FAQ), `/a-propos`, `/contact`, `/confidentialite`. Les anciennes adresses `/expertise-odoo` et `/accompagnement` redirigent vers `/plateforme`, `/vos-enjeux` vers `/tarifs#trouver`. Toute autre adresse affiche la page 404.

## Formulaire de contact : comportement réel

**Mode brouillon (défaut).** Rien n’est envoyé. Le visiteur prépare sa demande, puis la copie ou la télécharge. Aucune donnée personnelle n’est conservée dans `localStorage` ni dans des cookies. Si `VITE_CONTACT_EMAIL` est renseigné, un bouton ouvre en plus la messagerie du visiteur (`mailto`).

**Mode `api` (optionnel).** Avec `VITE_CONTACT_DELIVERY=api`, le formulaire appelle `POST /api/contact` (`api/contact.ts`, fonction serverless, envoi via Resend en `fetch`). Le succès n’est affiché que si la réponse contient `delivered: true`. Variables serveur, toutes requises :

- `RESEND_API_KEY` : secret, à saisir dans les paramètres sécurisés de l’hébergeur ;
- `CONTACT_FROM_EMAIL` : expéditeur vérifié chez le fournisseur ;
- `CONTACT_TO_EMAIL` : destinataire.

Si l’une manque, la fonction répond 503 `{ delivered: false, reason: 'not-configured' }` et le site retombe sur le brouillon. Il n’existe aucun destinataire par défaut, et le visiteur ne peut choisir ni le destinataire ni l’expéditeur (son e-mail sert uniquement de `reply_to`).

**Destinataire confirmé : contact@ozania.com.** Il est utilisé par défaut pour le bouton « Ouvrir dans ma messagerie » (lien `mailto:`, envoyé par le visiteur lui-même). L’envoi direct n’est pas activé : le site est une vitrine. Pour l’activer plus tard, renseigner `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `RESEND_API_KEY` et `VITE_CONTACT_DELIVERY=api` dans les paramètres Vercel. Voir `.env.example`.

## Prévisualisation autonome

```sh
npm run export:preview
npm run test:preview
```

Produit `exports/ozania-io-preview.html` : un seul fichier avec CSS, JavaScript, polices et images embarqués, sans requête réseau. Ouvrez-le directement dans un navigateur (`file://`). La navigation utilise le routage par hash (`#/tarifs`, `#/contact`…) grâce à `<meta name="oz-preview" content="standalone">`. Une copie statique de l’accueil est incluse : un lecteur qui bloque les scripts voit donc la page, pas un écran vide. Le formulaire y reste en mode brouillon.

## Déploiement

Le projet Vercel « ozania.io » (équipe revolution-group) est relié au dépôt `grouperev/ozania.io` : chaque poussée sur `main` déclenche un déploiement, visible sur https://ozaniaio.vercel.app. Ne jamais utiliser le projet Vercel de la société mère (`grouperev/Ozania`). Le statut d’un déploiement se lit sur le commit GitHub (contexte « Vercel »).

## Documents associés

- `DESIGN.md` : direction de design
- `design-qa.md` : contrôles qualité du design
- `CONTENT-NOTES.md` : notes et provenance des contenus
