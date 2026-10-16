# Content notes · ozania.io

What the site says, what is confirmed, and what still needs a decision before public launch.

## Confirmed (from the brief)

- ozania.io is a separate company in the same group as Ozania.
- Its specialization is integrating Odoo for businesses.
- The approved visual direction is the violet/white Ozania kit with 14mm low-angle photography.
- The French language is the default.

## Not confirmed, so written neutrally or left out

| Topic | Current treatment on the site | Needed before launch |
| --- | --- | --- |
| Contact recipient | Confirmed on 2026-10-16: **contact@ozania.com**. Not enabled: the site is a showcase for now, so the form stays in local draft mode (copy/download) and `VITE_CONTACT_EMAIL` is empty. | When messaging is wanted: set `VITE_CONTACT_EMAIL` (mailto button) or direct sending (`VITE_CONTACT_DELIVERY=api`, `CONTACT_TO_EMAIL=contact@ozania.com`, a verified `CONTACT_FROM_EMAIL`, `RESEND_API_KEY` in Vercel settings), and update the privacy page. |
| Legal entity, address, registration, publisher | Not shown. The privacy page says it will be completed before publication. | Legal name, address, registration number, publication director, host. |
| Data controller | Privacy page says contact details will be added once confirmed. | Name and contact for data-protection requests. |
| Hosting provider | Privacy page says it will be named at public launch. | Provider and region. |
| Logo | Shared Ozania mark (supplied) plus a typographic ".io" suffix in Space Grotesk. Provisional. | A confirmed ozania.io mark, or approval of this lockup. |
| Odoo partner status, certifications | Not mentioned. Footer states ozania.io is independent of Odoo S.A. and that Odoo is a trademark of Odoo S.A. | Only add if verified, with wording approved by Odoo's partner rules. |
| Services offered | Six categories (cadrage, paramétrage, migration, connexions, formation, suivi) presented as areas of work, not contractual commitments. | Confirm which ones are actually offered, and any limits (e.g. custom development, hosting, support hours). |
| Odoo applications listed | 14 standard Odoo apps used to explain flows. Copy says the scope depends on edition and configuration. Some (e.g. Assistance/Helpdesk) are Enterprise-only. | Confirm which apps the team deploys, editions and versions supported. |
| Flows between apps | Described as "usages courants d’Odoo" with a caveat about edition/configuration. | Review wording with the technical team. |
| Example sectors | Four illustrative situations, explicitly "des exemples pour amorcer la réflexion". No client names. | Replace or support with real (authorized) case studies later. |
| Project duration, pricing, guarantees | Deliberately absent. FAQ says an estimate is built after scoping. | Only add if a real policy exists. |
| Locations served, languages | Not stated. | Countries/regions and whether Arabic/English versions are planned. |
| Team, years of experience, number of projects | Not stated. The parent company's 25 years / 120+ projects / three countries are NOT reused. | Real figures for ozania.io only, if any. |
| Client logos, testimonials | None. Parent-company marks and testimony are not reused. | Real, authorized evidence for ozania.io. |
| "Présence / accompagnement des premiers jours" | Phrased as part of the method, not a service level. | Confirm this matches how the team works. |

## Imagery

All photographs are generated illustrations, not staff. Captions say "Visuel d’illustration" and the About page adds "Ne représente pas l’équipe d’ozania.io".

| File (public/images) | Source (assets/originals) | Original px | Web px | Notes |
| --- | --- | --- | --- | --- |
| team-collaboration.webp | collaboration-14mm-low-angle.png (kit) | 1672×941 | as supplied | Home hero desktop, Expertise |
| team-mobile.webp | crop of the above (kit) | 800×899 | as supplied | Home hero phone |
| team-commerce.webp | commerce-14mm-low-angle.png (kit) | 1536×1024 | as supplied | Connexions, Commerce example |
| team-low-angle.webp | team-14mm-low-angle.png (kit) | 1122×1402 | as supplied | About, Suivi |
| team-workshop.webp | workshop-14mm-low-angle.jpg (new) | 2848×1600 | 1920×1079 | Cadrage, home journey band, Industrie example |
| team-stock.webp | stock-14mm-low-angle.jpg (new) | 2848×1600 | 1920×1079 | Migration, Négoce example |
| team-training.webp | training-14mm-low-angle.jpg (new) | 1856×2320 | 1200×1500 | Formation, principles, Services example |

New images were generated with Seedream 4.5 on 2026-10-16 (about 2K output; dimensions above are the actual files, not an upscale). A first training image was rejected for circular fisheye curvature and kept as `assets/originals/rejected-training-fisheye.jpg` for reference only. The "14mm" description is the visual brief, not camera metadata.

## Copy conventions

- Visible text uses no em or en dashes.
- No superlatives, no invented numbers, no client claims.
- Odoo app names follow Odoo's French interface (CRM, Ventes, Inventaire, Achats, Facturation, Comptabilité…).
