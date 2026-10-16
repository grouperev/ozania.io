import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowUp, List, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { searchIndex, company } from './data';

export const nav = [
  { label: 'Expertise Odoo', to: '/expertise-odoo' },
  { label: 'Accompagnement', to: '/accompagnement' },
  { label: 'Vos enjeux', to: '/vos-enjeux' },
  { label: 'À propos', to: '/a-propos' },
];

export function Action({ to = '/contact', children = 'Parlons de votre projet', variant = 'primary', className = '' }: { to?: string; children?: ReactNode; variant?: 'primary' | 'outline' | 'light'; className?: string }) {
  return <Link className={`button button-${variant} ${className}`} to={to}><span>{children}</span><ArrowUpRight size={20} aria-hidden="true" /></Link>;
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="text-link"><span>{children}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>;
}

/** Supplied group mark (luminance mask) followed by a typographic ".io" suffix. */
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="ozania.io, accueil">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-suffix" aria-hidden="true">.io</span>
    </Link>
  );
}

/** Native dialog with focus trap, Escape, backdrop close, focus return and scroll pause. */
export function Modal({ open, close, title, children, className = '' }: { open: boolean; close: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      window.dispatchEvent(new Event('oz:pause'));
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.classList.remove('dialog-open');
      window.dispatchEvent(new Event('oz:resume'));
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
      returnFocus.current = null;
    }
  }, [open]);
  useEffect(() => () => { document.body.classList.remove('dialog-open'); window.dispatchEvent(new Event('oz:resume')); }, []);
  return (
    <dialog ref={ref} className={`modal ${className}`} aria-label={title} data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === ref.current) close(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex="0"]')).filter((node) => node.getClientRects().length);
        if (!nodes.length) return;
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0].focus(); }
      }}>
      <div className="modal-content">
        <button type="button" className="modal-close" onClick={close} aria-label="Fermer"><span aria-hidden="true" /></button>
        {children}
      </div>
    </dialog>
  );
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function SearchDialog({ open, close }: { open: boolean; close: () => void }) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const countId = useId();
  useEffect(() => { if (open) { setQuery(''); window.setTimeout(() => input.current?.focus(), 30); } }, [open]);
  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return searchIndex.filter((entry) => entry.kind === 'Page');
    return searchIndex.filter((entry) => { const haystack = normalize(`${entry.title} ${entry.description} ${entry.kind}`); return terms.every((term) => haystack.includes(term)); }).slice(0, 12);
  }, [query]);
  const suggestions = ['Stock', 'Migration', 'Formation', 'Facturation'];
  return (
    <Modal open={open} close={close} title="Rechercher sur le site" className="search-modal">
      <form role="search" onSubmit={(event) => { event.preventDefault(); if (results[0]) { close(); navigate(results[0].path); } }}>
        <label className="search-field">
          <MagnifyingGlass size={24} aria-hidden="true" />
          <span className="sr-only">Rechercher une page, une application Odoo ou une étape</span>
          <input ref={input} autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stock, migration, formation…" aria-describedby={countId} autoComplete="off" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } }} />
        </label>
      </form>
      <p className="search-count" id={countId} role="status" aria-live="polite">
        {query.trim() ? `${results.length} résultat${results.length > 1 ? 's' : ''} pour « ${query.trim()} »` : 'Pages principales'}
      </p>
      {results.length ? (
        <ul className="search-results">
          {results.map((entry) => (
            <li key={`${entry.kind}-${entry.title}`}>
              <Link to={entry.path} onClick={close}>
                <span className="search-kind">{entry.kind}</span>
                <span className="search-text"><strong>{entry.title}</strong><small>{entry.description}</small></span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="search-empty">
          <h2>Rien ne correspond pour l’instant.</h2>
          <p>Essayez un autre mot, par exemple :</p>
          <div className="search-suggestions">{suggestions.map((word) => <button type="button" key={word} onClick={() => { setQuery(word); input.current?.focus(); }}>{word}</button>)}</div>
          <p>Vous pouvez aussi décrire directement votre besoin.</p>
          <Action to="/contact">Préparer une demande</Action>
        </div>
      )}
    </Modal>
  );
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenu(false); setSearch(false); }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearch(true); } };
    const onScroll = () => setScrolled(window.scrollY > 12);
    const openSearch = () => setSearch(true);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('oz:search', openSearch);
    onScroll();
    return () => { document.removeEventListener('keydown', key); window.removeEventListener('scroll', onScroll); window.removeEventListener('oz:search', openSearch); };
  }, []);
  return (
    <>
      <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); const main = document.getElementById('main'); main?.focus(); window.scrollTo(0, main ? main.offsetTop - 80 : 0); }}>Aller au contenu</a>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <Brand />
        <nav className="desktop-nav" aria-label="Navigation principale">
          {nav.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="header-actions">
          <button type="button" className="icon-button" onClick={() => setSearch(true)} aria-label="Rechercher sur le site" aria-haspopup="dialog"><MagnifyingGlass size={21} aria-hidden="true" /></button>
          <Action className="header-cta">Parlons-en</Action>
          <button type="button" className="icon-button mobile-menu-toggle" aria-label="Ouvrir le menu" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(true)}><List size={25} aria-hidden="true" /></button>
        </div>
      </header>
      <Modal open={menu} close={() => setMenu(false)} title="Menu" className="menu-modal">
        <nav aria-label="Navigation mobile">
          <ul>
            {[{ label: 'Accueil', to: '/' }, ...nav, { label: 'Contact', to: '/contact' }].map((item, index) => (
              <li key={item.to} style={{ '--i': index } as CSSProperties}>
                <NavLink to={item.to} end onClick={() => setMenu(false)}><span>{item.label}</span><ArrowUpRight size={24} aria-hidden="true" /></NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="menu-note">Intégration Odoo pour les entreprises.<br />Une société du groupe {company.group}.</p>
      </Modal>
      <SearchDialog open={search} close={() => setSearch(false)} />
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Brand light />
          <p>Odoo, à la mesure de votre entreprise.<br />Une société du groupe {company.group}.</p>
        </div>
        <nav className="footer-links" aria-label="Pages du site">
          <p>Le site</p>
          {nav.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
        <div className="footer-links">
          <p>Commencer</p>
          <Link to="/vos-enjeux#selecteur">Composer un périmètre</Link>
          <Link to="/contact">Préparer une demande</Link>
          <Link to="/confidentialite">Confidentialité</Link>
        </div>
      </div>
      <div className="footer-word" aria-hidden="true" data-word="ozania.io" />
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ozania.io</span>
        <span>Odoo est une marque d’Odoo S.A. ozania.io est une société indépendante d’Odoo S.A.</span>
        <button type="button" onClick={() => { window.dispatchEvent(new Event('oz:top')); window.scrollTo({ top: 0 }); document.querySelector<HTMLElement>('.site-header .brand')?.focus(); }}>Retour en haut<ArrowUp size={16} aria-hidden="true" /></button>
      </div>
    </footer>
  );
}

export function PageHero({ label, title, text, children }: { label: string; title: ReactNode; text: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      <div className="page-hero-bottom">
        <p className="lede">{text}</p>
        {children && <div className="page-hero-actions">{children}</div>}
      </div>
    </section>
  );
}

export function Faq({ items, title = 'Les questions qui reviennent.' }: { items: [string, string][]; title?: string }) {
  return (
    <section className="faq">
      <div className="faq-intro" data-reveal>
        <h2>{title}</h2>
        <p>Une autre question ?<br /><Link to="/contact" className="inline-link">Posez-la dans votre demande.</Link></p>
      </div>
      <div className="faq-list">
        {items.map(([question, answer]) => (
          <details key={question}>
            <summary><span>{question.replace(/ \?/g, ' ?')}</span><Plus size={21} aria-hidden="true" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Closing({ title = <>Et si votre Odoo<br />commençait par une conversation ?</>, to = '/contact', label = 'Préparer ma demande' }: { title?: ReactNode; to?: string; label?: string }) {
  return (
    <section className="closing">
      <h2 data-reveal>{title}</h2>
      <div className="closing-side">
        <p>Décrivez votre activité et ce que vous aimeriez simplifier. Nous partirons de là.</p>
        <Link className="closing-orb" to={to}><ArrowUpRight size={44} weight="light" aria-hidden="true" /><span>{label}</span></Link>
      </div>
    </section>
  );
}

export function Figure({ src, alt, className = '', ratio, position, caption, eager = false, parallax = false }: { src: string; alt: string; className?: string; ratio?: string; position?: string; caption?: ReactNode; eager?: boolean; parallax?: boolean }) {
  return (
    <figure className={`photo ${className}`}>
      <div className="photo-frame" style={{ aspectRatio: ratio }}>
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'} style={{ objectPosition: position }} data-parallax={parallax || undefined} />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Keyboard support for a [role=tablist] (arrows, Home, End; automatic activation). */
export function onTabKey(event: ReactKeyboardEvent<HTMLElement>) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + tabs.length) % tabs.length;
  tabs[next].focus();
  tabs[next].click();
}
