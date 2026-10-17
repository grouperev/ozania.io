# Content notes · Ozania.io

What the site says, where each fact comes from, and what still needs a decision.

## Sources

1. The company presentation PDF supplied on 2026-10-16 (home page export of www.ozania.io, English).
2. The live site www.ozania.io, read on 2026-10-16: `/fr`, `/fr/platform`, `/fr/pricing`, `/fr/contactus` (and the English `/platform`, `/pricing`).
3. The user, in conversation: Ozania.io belongs to the same group as Ozania; contact recipient contact@ozania.com; no messaging needed for now (showcase).

The first version of this site described an Odoo integration consultancy. That was wrong: Ozania.io is a **DevOps console (SaaS) for Odoo**. Everything was rewritten from the sources above.

## Facts used, with source

| Fact on the site | Source |
| --- | --- |
| "Arrêtez de gérer vos serveurs. Commencez à gérer Odoo." / console to deploy, validate and orchestrate every Odoo environment from one interface | PDF p.1, live /fr |
| Deployment options: your cloud provider (AWS, Hetzner, Azure, DigitalOcean), your VPS/dedicated server over SSH, Ozania managed hosting | live /fr/platform |
| Staging validation before production, automated redundant backups and one-click restore, live monitoring (uptime, CPU, memory, disk), shared module library, Git-linked module updates, delegated access for client IT, white-label portal and domain on Agency | PDF p.1-2, live /fr/platform |
| Problem framing: fixed overhead per client, rising infra costs shrinking the invoice (Odoo.sh comparison), no brand presence on hosting | PDF p.1-2, live /fr |
| "Built by a team managing DevOps pipelines for 20 years", Odoo certified (badges 17, 18, 19), support in French, Arabic and English | PDF p.2, live /fr |
| Plans and prices in DZD: Discovery free 90 days; Solo 9 900 DA first year then 12 900 DA/year; Integrator 19 900 DA then 24 900 DA/year; Agency 109 900 DA flat/year; hosting not included | PDF p.3, live /fr/pricing |
| Plan features and the comparison table (instances, users, billing model, production, Ozania server optional, white branding, best for) | live /fr/pricing |
| 17 FAQ answers (Odoo 17 to 20 Community and Enterprise, no Enterprise licence resale, data stays on your servers, encrypted secrets and role-based access, etc.) | live /fr/pricing |
| Ozania.com handles Odoo development and support | live /fr/pricing FAQ |
| contact@ozania.com, +90 552 360 0708 | live /fr/contactus; recipient confirmed by the user |
| Infrastructure and tool names (AWS, Azure, Hetzner, OVHcloud, DigitalOcean, Hostinger, Git, GitHub, Docker, PostgreSQL, Ubuntu, Grafana, Prometheus, cAdvisor) | logo wall on PDF p.1 / live /fr, set as plain text (no third-party logos reproduced) |
| Console screenshots in `public/images/ui/` | downloaded from the live platform page (the company's own product imagery) |

## Small inconsistencies in the sources, and the choice made

- Discovery environments: home says "Test + Pré-Prod", the pricing page lists "Prod, Test", the comparison table says no production environment. The site follows the comparison table: test and pre-production, no production.
- The live FAQ mentions a "Sandbox" plan with two staging instances; the plans are otherwise called Discovery. The site says Discovery.
- Mixed English/French labels on the live site (e.g. "For managing multiple Odoo clients", "Deploy Anywhere") are translated to French.

## Still to confirm before public launch

| Topic | Current treatment |
| --- | --- |
| Legal notice (company name, registered office, publication director, host) | Privacy page says it will be added before public opening. `noindex` stays on. |
| Sign-in URL | "Se connecter" points to `https://www.ozania.io/web/login` (the live site's login). Update if this site replaces www.ozania.io or the console moves. |
| Account requests | "Demander mon compte gratuit" leads to the contact form (draft + mailto to contact@ozania.com). The live site's own request flow is not wired. |
| Direct sending | Not enabled (showcase only). `api/contact.ts` stays unconfigured. |
| Prices | Copied as published on 2026-10-16, in DZD. Re-check before launch; no other currency shown. |
| Phone number | +90 (Turkey) number as published on the live contact page. |
| Logo | Shared Ozania mark plus a typographic ".io" suffix. The live site uses the Ozania logo alone. |

## Imagery

All photographs are generated illustrations, not staff, and are captioned "Visuel d’illustration". Console images are real product screenshots, captioned "Capture de la console".

| Web file (`public/images`) | Original (`assets/originals`) | Original px | Web px | Generator | Use |
| --- | --- | --- | --- | --- | --- |
| team-console.webp, team-console-mobile.webp (crop) | devops-console-2k.png | 2752×1536 | 1920×1072, 820×774 | Magnific · Nano Banana 2.1 · 2K | Home hero, monitoring feature |
| team-release.webp | release-review-2k.png | 2752×1536 | 1920×1072 | Magnific · Nano Banana 2.1 · 2K | Home "why", white-label feature |
| team-client-call.webp (crop of the right two thirds) | client-call-2k.png | 1856×2304 | 1216×1368 | Magnific · Nano Banana 2.1 · 2K | Delegated access feature |
| team-low-angle.webp | team-14mm-low-angle.png (kit) | 1122×1402 | as supplied | kit | About |
| team-collaboration.webp, team-training.webp | kit / Seedream 4.5 | see kit | as before | earlier | references for the Magnific generations |

Magnific generations used `team-collaboration.webp` (style) and `team-training.webp` (image) as references. One client-call render was rejected for banding and dithering in the backlit window (`assets/originals/rejected-client-call-banding.png`, ignored by git). The photos from the first version that did not fit a digital product (paper workshop, stockroom, parcel bench) were removed from the site.

## Version 3 additions (2026-10-17)

- The deploy log on the home page is labelled "Illustration du flux": its lines restate the four pipeline steps, backups and monitoring already listed above. It does not depict a real CLI.
- Bento detail chips repeat words from each feature's own text (for example "provisionnement, correctifs, sécurité" for managed hosting; "sauvegardes, redémarrages, journaux" for delegated access). The `ssh root@votre-serveur` line illustrates "Conservez un accès SSH complet".
- The stack matrix groups the provider and tool names already used (logo wall) plus the Odoo versions 17 to 20, Community and Enterprise, from the FAQ. The grouping labels are ours; no deeper integration is claimed.
- The monitoring meter has no figures: it only names the four metrics the console tracks.

## Copy conventions

- Visible text uses no em or en dashes.
- Brand written "Ozania.io" in running text (as on the live site).
- Prices with a narrow space as thousands separator and "DA".
