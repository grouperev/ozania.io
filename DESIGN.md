# DESIGN · ozania.io

## Brief

ozania.io, a company in the Ozania group, integrates Odoo for businesses. Visitors are business owners, operations leads and decision makers. They should understand within seconds what the company does, recognise their own operational problems, see how a project unfolds, and leave a qualified inquiry. The approved direction is the Ozania violet/white kit; this is an adaptation, not a new ideation round.

## Design Read (web-design-engineer calibration)

```yaml
artifact: multipage corporate site with one interactive tool
audience: SME owners, operations and finance leads (French-speaking)
visual-language: editorial violet humanist; Mediterranean architecture photography; Swiss-leaning type hierarchy
mode: redesign · preserve (identity from kit, new business content)
visual-variance: 6   # asymmetric grids, varied section families, one signature diagram
motion-intensity: 4  # calm reveals, one scrubbed narrative, one live diagram
information-density: 4
asset-dependence: 8  # photography carries warmth and brand
brand-fidelity: 9    # palette, type, radius and photography kept from the kit
```

## Concept

**Le fil de vos opérations.** Odoo's value is not any single app but the information that travels between them: an opportunity becomes a quote, an order reserves stock, the order becomes an invoice. The site tells that story three ways, each one step more concrete:

1. **Gather** (home): six familiar scattered tools (shared client file, quotes in a word processor, stock spreadsheet…) drift loosely on a lavender board and settle into one ordered column as you scroll, each acquiring its Odoo app.
2. **Signature selector** (home, compact; Vos enjeux, full): the visitor toggles real operational needs. The Odoo apps that serve them light up across three lanes (Relation client · Opérations · Gestion) and the flows between active apps draw as curves with a slow travelling pulse. A plain-language list states what each flow does ("la commande devient facture"). The resulting scope is handed to the contact form through the URL.
3. **Journey** (Accompagnement): five tabbed phases, each with what we do together, what the client prepares and what comes out of it.

Every other section stays quiet so the selector is the single signature moment.

## System

| Token | Value | Use |
| --- | --- | --- |
| Deep violet | `#501080` | Headings, primary actions, active states, closing band |
| Violet hover | `#6a2a9c` | Primary hover |
| Soft violet | `#8158a0` | Second line of headings (≥ 4.5:1 on ground; the kit's `#8c63a8` was slightly darkened for AA body use) |
| Deep violet (footer) | `#3a0b5e` | Footer surface, separates it from the closing band |
| Ground | `#fcfbfd` | Page surface |
| Ink | `#2c1739` | Body text |
| Muted | `#6d6176` | Supporting copy (5.7:1 on ground) |
| Lavender | `#f1ebf7` | Secondary surfaces |
| Lavender strong | `#e6dbf0` | Rules on lavender, large decorative numbers |
| Border | `#ded6e5` | Hairlines |
| Focus | `#9561bc` | 3px focus ring (white on violet surfaces) |

Type: Space Grotesk Variable (display, weight 450, tight negative tracking) and Manrope Variable (body), both bundled locally via Fontsource. Display/body ratio on hero ≈ 9:1. Headings use `text-wrap: balance`, paragraphs `pretty`.

Radius grammar: `pill` for actions and choices (buttons, chips, tabs, need toggles in compact mode) · `14px panel` for surfaces (selector stage, contact card, journey result) · `10px media` for photographs · `8px field` for inputs and notices. No other radii.

Spacing: gutter `clamp(20px, 4.2vw, 80px)`, section rhythm `clamp(84px, 10vw, 150px)`. Cards appear only where they carry meaning (selector stage, contact card, review blocks); everything else is organised by rules, whitespace and type.

## Section families (to avoid repetition)

- Hero: left-aligned giant headline, action row, full-width 2.2:1 photo with label plate (from the kit).
- Gather: copy + animated board.
- Selector: lavender band, two-pane tool.
- Index list with following image (home services).
- Full-bleed 21:9 photo + 5-column step rail (home journey).
- Typographic statement on lavender.
- FAQ split, closing violet band with orb, deep-violet footer with oversized faint wordmark.
- Inner pages: sticky side index + long-form articles in three alternating layouts (Expertise), tabs with oversized phase number (Accompagnement), pill tabs + image/copy (sectors), definition lists with oversized terms (About, principles), prose (Privacy), outline 404.

## Motion

- One clock: Lenis runs on `gsap.ticker`; ScrollTrigger is updated from Lenis. Lenis is destroyed under `prefers-reduced-motion: reduce`.
- Route-scoped effects in a `gsap.matchMedia` context reverted on every route change.
- `[data-reveal]`: 28px rise and fade, once. `[data-parallax]`: ±4% yPercent on photographs.
- Gather board: one scrubbed timeline (scatter → order), only motion tied to scroll position.
- Selector: CSS stroke-dash draw (0.9s, staggered) and an SVG `animateMotion` pulse (not rendered under reduced motion).
- No loader, no cursor effects, no scroll-jacking, no WebGL. The first hero is never hidden by an entrance animation; route entrances animate only after the first paint.
- Reduced motion: smooth scroll off, scrub/parallax off, all content visible, CSS durations collapsed.

## Interaction and accessibility decisions

- Real routes with BrowserRouter (hash routing only in the standalone export). Titles and descriptions per route, focus moves to the new `h1` after navigation, hash targets land immediately on first load and glide in-app.
- Mobile navigation and search are native `<dialog>`s with focus trap, Escape, backdrop close and focus return; Ctrl/⌘ K opens search. Search is accent-insensitive, multi-term, has an empty state with suggestions.
- Tabs (journey, sectors) follow the ARIA pattern with roving tabindex, arrows, Home and End; `?etape=` / `?secteur=` deep-link a tab.
- Need toggles are `button[aria-pressed]`; the map is a set of labelled lists with a hidden "incluse / non sélectionnée" status; counts are announced politely. On phones the curves are replaced by wrapped lane chips plus the textual flow list.
- Contact: three steps (scope → details → review). Per-field errors with `aria-invalid` / `aria-describedby`, a focusable error summary with links, honeypot field. Result says "prête, pas encore envoyée" in draft mode; "envoyée" appears only if `/api/contact` returns `delivered: true`. No personal data in localStorage, sessionStorage or cookies.

## Logo

The supplied Ozania raster mark is opaque white-on-black. It was converted to an alpha mask (`public/images/ozania-mark.png`, 734×97, trimmed) so it can be tinted with `currentColor` through a standard CSS mask in every browser. ".io" is set in Space Grotesk next to it. This lockup is provisional (see CONTENT-NOTES.md).

## Skills and tools actually used

- Garden Skills `web-design-engineer`: Design Read and dials, failure-pattern review (removed repeated eyebrows from inner sections, avoided zigzag runs and filler split headers, single signature moment, radius grammar), browser-acceptance protocol for QA.
- `awwwards` skill from github.com/juliobsz/skills (MIT), read but not executed: quality rubric, copy rules (no dashes, no filler verbs), motion rules (one clock, reduced-motion path, real-text LCP).
- Requested `cloud-environment-onboarding`, `product-design:*` and a plugin-installed `$awwwards` skill were not available in this session; their roles were covered by the kit documents and the two skills above.
- Image generation: Seedream 4.5 via the Geniri connector (3 accepted images, 1 rejected). Figma, Stitch, Magnific and Vercel were not used.
