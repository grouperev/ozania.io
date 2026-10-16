# Design QA · Ozania.io

## Version 2 (2026-10-16): DevOps console content

The site was re-scoped from an "Odoo integration consultancy" (v1, wrong) to the real product: the Ozania.io DevOps console for Odoo. Results below are from real Chromium renders of the production build (`vite build` + `vite preview` at http://localhost:4181), with `scripts/verify.mjs` (Playwright 1.64, Chromium headless shell 1234) and manual inspection in the desktop browser pane at 1440, 390 and 320px.

### Automated pass (final run, `.shots/verify-v2-final.log`): 18 / 18

| # | Check | Result |
| --- | --- | --- |
| 1 | Direct loads of `/`, `/plateforme`, `/tarifs`, `/a-propos`, `/contact`, `/confidentialite`, unknown route: 200, one h1, unique titles, no console or network errors, all images loaded (hero console window, 6 console screenshots) | PASS |
| 2 | No horizontal overflow at 1440, 390, 320 on every route | PASS |
| 3 | Full-page screenshots, 3 widths × 7 routes, plus home folds | PASS |
| 4 | axe-core wcag2a/aa + 21a/aa | PASS, 0 violations |
| 5 | Keyboard: skip link first, visible 3px focus on every stop | PASS |
| 6 | Mobile menu dialog: open, Escape returns focus, link navigates and closes | PASS |
| 7 | History back/forward | PASS |
| 8 | Search: results for "staging", empty state, suggestions, Escape, Ctrl/⌘ K | PASS |
| 9 | Old v1 routes redirect | PASS |
| 10 | Plan finder: Integrator / Discovery / Solo / Agency rules, environment chips, keyboard radios and switch | PASS |
| 11 | Finder → contact: plan and hosting preselected | PASS |
| 12 | Contact: details shown, validation, review, draft result ("prête, pas encore envoyée"), mailto to contact@ozania.com, `.txt` download, copy, no storage or cookies | PASS |
| 13 | Pricing: 4 plan cards, comparison table, 17 FAQ entries | PASS |
| 14 | Header "Se connecter" href and "Compte gratuit" CTA | PASS |
| 15 | Platform sticky index updates `aria-current` | PASS |
| 16 | FAQ by click and Enter | PASS |
| 17 | Reduced motion: hero visible at once, all reveals at opacity 1 | PASS |
| 18 | First paint: h1 visible within 300 ms | PASS |

Standalone export (`scripts/verify-preview.mjs`): 7 / 7 (homepage without JavaScript, hash navigation, finder → contact carry, no console errors, zero http(s) requests). Size 2.86 MB.

### Issues found and repaired in v2

| Found by | Issue | Fix |
| --- | --- | --- |
| User | Content described an integration consultancy; ozania.io is a DevOps console | Full content rewrite from the company PDF and www.ozania.io |
| User | Workshop photo (paper diagram) illogical for a digital service and low quality | Removed with the stockroom and parcel photos; three new Magnific Nano Banana 2.1 (2K) scenes of on-screen work, plus real console screenshots |
| Manual | One new render showed banding/dithering in a backlit window | Regenerated, then cropped to the clean right two thirds |
| Manual, 1440 | Longer hero headline pushed the photo below the fold | Home h1 scale reduced |
| Manual, 1440 | Feature index titles squeezed by a label column; screenshots small in a tall frame | Label stacked above title; squarer visual frame |
| Harness, 390/320 | `/tarifs` page widened to 669px by screen-reader labels escaping the table scroller | `position: relative` on the scroll container |
| axe | Problem numbers 2.52:1 on lavender; inactive environment chips 3.82:1 | Darker soft-violet and muted tones |

### Visual notes

- Photography only carries people; product capabilities are shown with real console screenshots in framed lavender panels, captioned as such.
- Crops checked at 1440, 390 and 320: both faces visible in the mobile hero crop; the console window drops below the photo on phones.

---

## Version 1 (superseded)

### Scope

- Environment: production build served by `vite preview` at `http://localhost:4181`. Chromium headless shell 1234 through Playwright 1.64 (`scripts/verify.mjs`), plus manual inspection in the Claude desktop browser pane.
- Viewports: 1440×900 desktop, 390×844 phone, 320×640/844 narrow phone.
- Routes: `/`, `/expertise-odoo`, `/accompagnement`, `/vos-enjeux`, `/a-propos`, `/contact`, `/confidentialite`, and an unknown route (404).
- Standalone export: `exports/ozania-io-preview.html` checked over `file://` by `scripts/verify-preview.mjs`.

## Automated pass (final run, `.shots/verify-run3.log`): 14 / 14

| # | Check | Result |
| --- | --- | --- |
| 1 | Direct route loads: HTTP 200, one visible h1, unique title, no console or page errors, every image `naturalWidth > 0`, no failed same-origin request | PASS |
| 2 | No horizontal overflow at 1440, 390, 320 on all 8 routes | PASS |
| 3 | Full-page screenshots, 3 widths × 8 routes, plus the home fold | PASS |
| 4 | axe-core wcag2a/aa + 21a/aa on all routes | PASS, 0 violations |
| 5 | Keyboard: skip link first, logical order, visible 3px focus ring on every stop | PASS |
| 6 | Mobile menu dialog: open, Escape returns focus to the toggle, link navigates and closes | PASS |
| 7 | Browser history back/forward between real routes | PASS |
| 8 | Search: focus in field, results, empty state with suggestions, Escape, Ctrl/⌘ K | PASS |
| 9 | Selector: `aria-pressed`, nodes light, curves drawn, scope carried to `/contact?besoins=…` and prefilled | PASS |
| 10 | Contact: step guard, error summary + `aria-invalid` + per-field messages, invalid email message, review step, draft result heading "Votre demande est prête. Elle n’a pas encore été envoyée.", no "envoyée" success text, `.txt` download, copy to clipboard, nothing in localStorage, sessionStorage or cookies | PASS |
| 11 | Journey and sector tabs: arrows, Home, End, `?etape=` deep link, "Charger cet exemple" presses the matching needs | PASS |
| 12 | FAQ `details` by click and by Enter | PASS |
| 13 | Reduced motion: hero visible at once, every `[data-reveal]` at opacity 1 | PASS |
| 14 | Without reduced motion, the h1 is visible within 300 ms of DOMContentLoaded | PASS (see note) |

Standalone export (`scripts/verify-preview.mjs`): 7 / 7. Homepage h1 and 8 images render with JavaScript disabled. Hash navigation, the selector-to-contact flow, no console errors and zero http(s) requests all pass. Size 4.57 MB.

## Issues found and repaired

| Found by | Issue | Fix |
| --- | --- | --- |
| Manual, 1440 | Gather headline wrapped into 5 short lines | Section-specific heading size |
| Manual, 1440 | Lavender statement left a large empty right half | Wider measure (30ch) |
| Manual, 390 | Header "Parlons-en" button broke onto two lines | `nowrap`, compact padding at ≤760px, hidden at ≤440px (hero CTA and menu Contact cover it) |
| Manual | Direct load of `/accompagnement?etape=…#etapes` stayed at the top (Lenis smooth scroll never progressed in a throttled pane) | Deep links on first load jump immediately; in-app anchors still glide |
| Harness, 390 | Header actions overflowed by 5px | Same header fix, tighter action gap |
| Harness, 320/390 | Gather scatter transforms widened the page before scrolling | `overflow-x: clip` on the section |
| axe | Inactive journey tab numbers at 2.86:1 | Soft violet (≈5.3:1) |
| axe | Decorative footer wordmark and oversized phase number flagged (aria-hidden decoration) | Rendered as CSS generated content |
| Review | Checkbox rings at about 2.9:1 against the ground (below 3:1 for UI boundaries) | Soft violet rings |
| Harness | First Escape in the search field only cleared the native search input | Escape closes the dialog from the field |
| Manual | Search dialog initially focused the close button for a moment | `autoFocus` on the field |
| Manual, 390/320 | "à" stranded at the end of the first hero line | Non-breaking space in "à la mesure" |

The last three fixes were made after run 3. They are covered by the final rebuild and its re-run recorded in the README commands (`npm run test:e2e`).

## Visual comparison with the kit

Compared against `kit/assets/screenshots/1440-hero.png`, `1440-home.png`, `390-hero.png` and `1440-about.png`:

- Kept: the palette, Space Grotesk/Manrope pairing and scale, two-tone headline, pill actions, full-width 2.2:1 hero photo with label plate and round arrow, the "Visuel d’illustration" caption line, the FAQ split, the violet closing band with orb, and the 14mm low-angle photography.
- Changed on purpose: the parent company's client logos, metrics (25 ans, 120+, 3 pays), testimonial, e-commerce cards and price grid are gone. Odoo-specific sections replace them (Gather, signature selector, service index, journey rail). The footer moves to a deeper violet so it separates from the closing band.
- Photography crops were checked at each width. Faces stay inside the frame in the hero (the near-left foreground figure is intentionally cut, as in the kit), the service visual and the sector panels. The training image uses `object-position: 62% 55%` to keep the three faces.

## Notes and limits

- First-paint timing (check 14) depends on JavaScript boot: this is a client-rendered SPA. In run 2 one cold start measured 344 ms (h1 already fully visible when probed). Runs 1 and 3 passed. Prerendering would remove the dependency if it matters later.
- The JS bundle is 494 kB (162 kB gzip): React, React Router, GSAP + ScrollTrigger and Lenis. No performance score is claimed.
- Playwright 1.64 expects Chromium 1248. The scripts fall back to the cached 1234 headless shell or `CHROMIUM_PATH`.
- Smooth scrolling depends on requestAnimationFrame. In a hidden or throttled tab it pauses, which is expected browser behaviour.
- Not tested: Safari, Firefox, real touch devices, screen readers beyond the automated semantics checks.

## Evidence

- `.shots/qa/1440/`, `.shots/qa/390/`, `.shots/qa/320/`: full-page PNGs of every route.
- `.shots/qa/fold-1440.png`, `fold-390.png`, `fold-320.png`: home above the fold.
- `.shots/qa/summary.json`: per-check results, axe output, focus sequence.
- `.shots/verify-run2.log`, `.shots/verify-run3.log`: raw harness output before and after the final fixes.
