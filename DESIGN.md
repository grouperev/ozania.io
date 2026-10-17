# DESIGN · Ozania.io

## Version 3 (2026-10-17): dark mode, DevOps voice, motion

Audience is technical (integrators, DevOps and IT leads), so the site now reads like a tool: dark ground, mono labels, a deploy log, glowing actions and live status lights.

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| Ground | `#0d0912` | Page | |
| Surface / strong / card | `#17101f` / `#241a2f` / `#1b1325` | Panels, cards | |
| Ink | `#f1ecf6` | Body text | ≥ 14.3:1 on every surface |
| Muted | `#bdb2c8` | Supporting copy | ≥ 8.2:1 |
| Accent text | `#d2b4f7` | Headings, links, active | ≥ 9.2:1 |
| Accent soft | `#b195d4` | Second heading line, labels | ≥ 6.4:1 |
| Accent fill | `#6a2cb0` (gradient to `#7a38c6`) | Primary actions, highlighted plan | white text 8.1:1 |
| Control line | `#7d6c90` | Input and control boundaries | ≥ 3.5:1 |
| LED | `#4fd69a` | Live status | 9:1, always paired with text |
| Mono | JetBrains Mono (bundled) | Eyebrows (`// …`), labels, terminal, tool chips | |

New home sections (in `src/devops.tsx`): **deploy log** terminal beside the pipeline lanes (illustration of the four real steps, typed in line by line), **feature bento** with all nine capabilities (real screenshots on wide cards, mono detail chips taken from each feature's copy, a monitoring meter), **stack matrix** grouping every provider and tool (cloud and servers, code, runtime, observability, Odoo versions and editions) with status lights that switch on in sequence. It replaces the former feature index.

Glow: primary buttons (inner highlight plus violet bloom, stronger on hover), focus ring halo, active nav link, selected options, pipeline nodes as they light, status LEDs, terminal markers, bento card gradient border on hover. Glow is decorative only; all text meets contrast without it.

Motion (`src/motion.ts`, GSAP, all reverted per route and skipped under reduced motion): headings rise out of a clip mask; photos open from an inset frame while scrolling; cards arrive in staggered batches; the hero photo opens and the console window lands with a slight 3D tilt, then follows the pointer; pointer spotlight on cards; magnetic primary actions; a glowing packet travels the pipeline rail; CSS-only scroll progress bar under the header; drifting hero glow and grid; provider marquee (pauses on hover/focus); closing-band sheen. Pointer effects only on fine pointers. Transform, opacity and clip-path only; no scroll-jacking.


## Brief

Ozania.io, a company in the Ozania group, sells a **DevOps console for Odoo**: deploy, validate (staging) and orchestrate every Odoo environment from one interface, on the customer's cloud, their VPS, or Ozania-managed servers. Visitors are Odoo integrators, small agencies and companies running their own Odoo without a DevOps team. They should understand within seconds what the console does, see how it fits their infrastructure, pick a plan, and request an account. Facts come from the company PDF and www.ozania.io (see CONTENT-NOTES.md).

Version 2 (2026-10-16) replaced a first version that wrongly described an Odoo integration consultancy.

## Design Read (web-design-engineer calibration)

```yaml
artifact: multipage product marketing site for a B2B SaaS console
audience: Odoo integrators, agency leads, in-house Odoo owners (French-speaking)
visual-language: editorial violet humanist + real product UI; Mediterranean office photography
mode: redesign · preserve (identity from kit, product content from the live site)
visual-variance: 6
motion-intensity: 4
information-density: 5   # pricing table, FAQ, feature lists
asset-dependence: 9      # real console screenshots carry the product
brand-fidelity: 9
```

## Concept

**Du commit à la production.** The product's value is the operational layer between a developer's commit and a client's production instance. The site shows it three ways:

1. **Hero**: a photo of engineers at a server dashboard with the real console window ("Servers", 7 providers, all Ready) floating over its corner. Photo for the human, screenshot for the truth.
2. **Pipeline** (home): Poussez → Staging → Validez → Production, a rail that fills with scroll and lights each node, with two always-on lanes underneath (backups, monitoring) and a live green pulse. Reduced motion shows it complete.
3. **Plan finder** (signature interaction, home compact and /tarifs full): three questions (for whom, where the servers run, does client IT need access). A console-styled card lights the environments included (Test, Staging, Production), names the plan with its real price and features, explains the chosen hosting option, and links to `/contact?offre=…&hebergement=…`, which preselects the contact form.

Everything else stays quiet: feature index with a following visual, problem list, "why" facts, pricing cards and a real table.

## Photography and product imagery

- Product capabilities are illustrated with **real console screenshots** from www.ozania.io, framed on lavender with a soft shadow and captioned "Capture de la console".
- Photographs only carry people and context. Three new scenes were generated with Magnific (Nano Banana 2.1, 2K) using the site's existing photos as style/character references: engineers at a monitoring dashboard, a team reviewing a staging-to-production release on a wall screen, an integrator on a call with a client's IT manager in front of a restore dashboard. Screens in photos show abstract interfaces only.
- Off-topic scenes from version 1 (paper workshop, stockroom, parcel bench) were removed.

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

- Hero: left-aligned headline, action row, 2.2:1 photo with a floating console window.
- Infrastructure strip: providers in display type, tools in mono.
- Pipeline rail (home), problem list on lavender, feature index with following visual, 21:9 photo + facts, plan finder on lavender, FAQ split, violet closing band, deep-violet footer.
- Plateforme: three-column options with a violet top rule, sticky side index + long-form features alternating screenshot and photo layouts, benefits grid.
- Tarifs: four plan cards (Integrator in violet), finder, real `<table>` comparison, full FAQ.
- À propos: portrait + copy, oversized definition terms, group statement linking to Ozania.com.

## Motion

- One clock: Lenis runs on `gsap.ticker`; ScrollTrigger is updated from Lenis. Lenis is destroyed under `prefers-reduced-motion: reduce`.
- Route-scoped effects in a `gsap.matchMedia` context reverted on every route change.
- `[data-reveal]`: 28px rise and fade, once. `[data-parallax]`: ±4% yPercent on photographs.
- Pipeline: one scrubbed timeline driving two CSS variables (`--fill` on the rail, `--lit` per node).
- Plan finder: CSS transitions on environment chips (staggered 90ms) and a short panel entrance when the plan changes.
- No loader, no cursor effects, no scroll-jacking, no WebGL. The first hero is never hidden by an entrance animation; route entrances animate only after the first paint.
- Reduced motion: smooth scroll off, scrub/parallax off, all content visible, CSS durations collapsed.

## Interaction and accessibility decisions

- Real routes with BrowserRouter (hash routing only in the standalone export); old v1 routes redirect (`/expertise-odoo`, `/accompagnement` → `/plateforme`; `/vos-enjeux` → `/tarifs#trouver`). Titles and descriptions per route, focus moves to the new `h1` after navigation, deep links land immediately.
- Mobile navigation and search are native `<dialog>`s with focus trap, Escape, backdrop close and focus return; Ctrl/⌘ K opens search. Search covers pages, features, plans and all 17 FAQ answers.
- Plan finder: native radio groups and a `role="switch"` checkbox inside labelled fieldsets; result announced politely; environment chips carry hidden "inclus / non inclus" text.
- Pricing comparison is a real table with caption, column and row headers, check/minus icons backed by text, horizontally scrollable region on small screens.
- Contact: three steps (request → details → review), per-field errors with `aria-invalid` / `aria-describedby`, focusable error summary, honeypot. The result never claims a message was sent: the visitor copies, downloads, or opens it in their own mail client addressed to contact@ozania.com. No personal data in localStorage, sessionStorage or cookies.

## Logo

The supplied Ozania raster mark is opaque white-on-black. It was converted to an alpha mask (`public/images/ozania-mark.png`, 734×97, trimmed) so it can be tinted with `currentColor` through a standard CSS mask in every browser. ".io" is set in Space Grotesk next to it. This lockup is provisional (see CONTENT-NOTES.md).

## Skills and tools actually used

- Garden Skills `web-design-engineer`: Design Read and dials, failure-pattern review (removed repeated eyebrows from inner sections, avoided zigzag runs and filler split headers, single signature moment, radius grammar), browser-acceptance protocol for QA.
- `awwwards` skill from github.com/juliobsz/skills (MIT), read but not executed: quality rubric, copy rules (no dashes, no filler verbs), motion rules (one clock, reduced-motion path, real-text LCP).
- Requested `cloud-environment-onboarding`, `product-design:*` and a plugin-installed `$awwwards` skill were not available in this session; their roles were covered by the kit documents and the two skills above.
- Image generation: v1 used Seedream 4.5 (Geniri connector). v2 used Magnific with Nano Banana 2.1 at 2K (3 accepted, 1 rejected for banding). Figma and Stitch were not used. Vercel: deployed through the GitHub integration on the user's dedicated ozania.io project.
