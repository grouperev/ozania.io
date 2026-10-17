import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Cards that get the pointer spotlight. */
const SPOT = '.bento-card, .stack-group, .plan, .finder-option, .finder-result, .topic, .options-list li, .benefits dl > div, .problem-list li, .contact-card, .shot';
/** Actions that lean toward the pointer. */
const MAGNETIC = '.button-primary, .closing-orb, .round-button';

/**
 * Route-scoped scroll motion. Called inside a gsap.matchMedia context that only
 * runs without reduced motion, so everything here is reverted on route change.
 * Only transform, opacity and clip-path are animated.
 */
export function routeMotion(root: HTMLElement, firstLoad: boolean) {
  // Headings rise out of a mask once, as they enter.
  gsap.utils.toArray<HTMLElement>('h2', root).forEach((heading) => {
    if (heading.closest('.plan, .search-empty')) return;
    gsap.fromTo(heading,
      { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 18 },
      { clipPath: 'inset(0% 0% -10% 0%)', yPercent: 0, duration: 1, ease: 'expo.out', clearProps: 'clipPath,transform', scrollTrigger: { trigger: heading, start: 'top 90%', once: true } });
  });

  // Photographs open from a slightly inset frame while they scroll in.
  gsap.utils.toArray<HTMLElement>('.photo-frame', root).forEach((frame) => {
    gsap.fromTo(frame,
      { clipPath: 'inset(7% 5% 7% 5% round 10px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 10px)', ease: 'none', scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 45%', scrub: 0.5 } });
  });

  // Cards arrive in a short stagger, grouped by row.
  const cards = gsap.utils.toArray<HTMLElement>('.bento-card, .stack-group, .plan, .options-list li, .problem-list li, .benefits dl > div', root)
    .filter((card) => !card.hasAttribute('data-reveal'));
  if (cards.length) {
    gsap.set(cards, { y: 36, autoAlpha: 0 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'opacity,visibility,transform' }),
    });
  }

  // Home hero: the photo opens and the console window lands. The headline is never hidden.
  const heroFrame = root.querySelector<HTMLElement>('.hero-image-frame');
  const heroUi = root.querySelector<HTMLElement>('.hero-ui');
  if (heroFrame && heroUi) {
    const tl = gsap.timeline({ delay: firstLoad ? 0.15 : 0.05 });
    tl.fromTo(heroFrame, { clipPath: 'inset(10% 8% 0% 8% round 10px)' }, { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' }, 0)
      .from(heroUi, { y: 60, rotateX: 14, autoAlpha: 0, duration: 1.2, ease: 'expo.out', clearProps: 'opacity,visibility' }, 0.35);
    // The console window drifts up a little faster than the page.
    gsap.to(heroUi, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: heroFrame, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

/**
 * Pointer effects for fine pointers only: spotlight on cards, magnetic actions
 * and a gentle tilt on the hero console window. Returns a cleanup.
 */
export function pointerMotion() {
  const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let active: HTMLElement | null = null;
  let magnet: HTMLElement | null = null;
  const release = (node: HTMLElement) => gsap.to(node, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .45)' });

  const move = (event: PointerEvent) => {
    if (!query.matches) return;
    const target = event.target instanceof Element ? event.target : null;

    const card = target?.closest<HTMLElement>(SPOT) ?? null;
    if (card !== active) { active?.classList.remove('spot'); active = card; card?.classList.add('spot'); }
    if (card) {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    }

    const pull = target?.closest<HTMLElement>(MAGNETIC) ?? null;
    if (magnet && pull !== magnet) release(magnet);
    magnet = pull;
    if (pull) {
      const box = pull.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
      const dy = (event.clientY - (box.top + box.height / 2)) / box.height;
      gsap.to(pull, { x: dx * 10, y: dy * 8, duration: 0.35, ease: 'power3.out' });
    }

    const hero = target?.closest<HTMLElement>('.home-hero');
    const ui = hero?.querySelector<HTMLElement>('.hero-ui');
    if (hero && ui) {
      const box = hero.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      gsap.to(ui, { rotateY: px * 8, rotateX: -py * 6, transformPerspective: 1200, duration: 0.8, ease: 'power3.out' });
    }
  };

  const leave = () => {
    active?.classList.remove('spot');
    active = null;
    if (magnet) release(magnet);
    magnet = null;
  };

  document.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  return () => {
    document.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
}
