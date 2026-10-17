import { useEffect, useRef } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Header, Footer } from './components';
import { ScopeProvider } from './Selector';
import { HomePage, PlatformPage, PricingPage, AboutPage, PrivacyPage, NotFoundPage } from './pages';
import ContactPage from './ContactPage';
import { pointerMotion, routeMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

const meta: Record<string, [string, string]> = {
  '/': ['La console DevOps pour Odoo', 'Ozania.io est la console DevOps qui vous permet de déployer, valider et orchestrer tous vos environnements Odoo depuis une seule interface.'],
  '/plateforme': ['La plateforme', 'Cloud, VPS ou hébergement géré : déploiement, staging, sauvegardes, surveillance, bibliothèque de modules, accès délégué et marque blanche pour Odoo.'],
  '/tarifs': ['Tarifs', 'Discovery gratuit 90 jours, Solo, Integrator et Agency : un abonnement fixe, indépendant du nombre d’utilisateurs.'],
  '/a-propos': ['À propos', 'Ozania.io, la couche DevOps d’Odoo au sein du groupe Ozania, construite par une équipe DevOps depuis 20 ans.'],
  '/contact': ['Contact', 'Demandez votre compte Ozania.io ou posez votre question à l’équipe.'],
  '/confidentialite': ['Confidentialité', 'Comment le site Ozania.io traite les informations saisies dans le formulaire.'],
};

function Site() {
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const initial = useRef(true);

  // One clock: Lenis is driven by the GSAP ticker; disabled entirely under reduced motion.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    const tick = (time: number) => lenis?.raf(time * 1000);
    const pause = () => lenis?.stop();
    const resume = () => lenis?.start();
    const top = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0));
    const toElement = (event: Event) => {
      const detail = (event as CustomEvent<HTMLElement | { target: HTMLElement; immediate?: boolean }>).detail;
      const { target, immediate = false } = detail instanceof HTMLElement ? { target: detail } : detail;
      const top = target.getBoundingClientRect().top + window.scrollY - 100;
      if (lenis && !immediate) lenis.scrollTo(target, { offset: -100 });
      else if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top });
    };
    function setup() {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = undefined;
      if (!media.matches) {
        lenis = new Lenis({ duration: 0.9, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }
    }
    setup();
    media.addEventListener('change', setup);
    window.addEventListener('oz:pause', pause);
    window.addEventListener('oz:resume', resume);
    window.addEventListener('oz:top', top);
    window.addEventListener('oz:scrollto', toElement);
    return () => {
      lenis?.destroy();
      gsap.ticker.remove(tick);
      media.removeEventListener('change', setup);
      window.removeEventListener('oz:pause', pause);
      window.removeEventListener('oz:resume', resume);
      window.removeEventListener('oz:top', top);
      window.removeEventListener('oz:scrollto', toElement);
    };
  }, []);

  // Pointer spotlight, magnetic actions and hero tilt (fine pointers, motion allowed).
  useEffect(() => pointerMotion(), []);

  // Titles, scroll restoration and focus on route change.
  useEffect(() => {
    const [name, description] = meta[location.pathname] || ['Page introuvable', 'Cette page n’existe pas ou a été déplacée.'];
    document.title = location.pathname === '/' ? `Ozania.io · ${name}` : `${name} · Ozania.io`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    if (!location.hash) { window.dispatchEvent(new Event('oz:top')); window.scrollTo(0, 0); }
    const timeout = window.setTimeout(() => {
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      // Deep links land immediately; in-app hash changes glide.
      if (target) window.dispatchEvent(new CustomEvent('oz:scrollto', { detail: { target, immediate: initial.current } }));
      if (!initial.current && !target) {
        const heading = main.current?.querySelector<HTMLElement>('h1');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
      initial.current = false;
      ScrollTrigger.refresh();
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  // Route-scoped motion. Everything is reverted when the route changes.
  useEffect(() => {
    const root = main.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]', root).forEach((node) => {
        gsap.from(node, { y: 28, autoAlpha: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity,visibility,transform', scrollTrigger: { trigger: node, start: 'top 92%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-parallax]', root).forEach((node) => {
        gsap.fromTo(node, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: node.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      routeMotion(root, initial.current);
      // Calm route entrance, only after the first paint so the first hero is never hidden.
      if (!initial.current) {
        const first = root.firstElementChild;
        if (first) gsap.from(first, { y: 14, opacity: 0.001, duration: 0.55, ease: 'power2.out', clearProps: 'opacity,transform' });
      }
    });
    return () => mm.revert();
  }, [location.pathname]);

  return (
    <>
      <Header />
      <main id="main" ref={main} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plateforme" element={<PlatformPage />} />
          <Route path="/tarifs" element={<PricingPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/expertise-odoo" element={<Navigate to="/plateforme" replace />} />
          <Route path="/accompagnement" element={<Navigate to="/plateforme" replace />} />
          <Route path="/vos-enjeux" element={<Navigate to="/tarifs#trouver" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/confidentialite" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const standalone = window.location.protocol === 'file:' || document.querySelector('meta[name="oz-preview"]')?.getAttribute('content') === 'standalone';
  const Router = standalone ? HashRouter : BrowserRouter;
  return <Router><ScopeProvider><Site /></ScopeProvider></Router>;
}
