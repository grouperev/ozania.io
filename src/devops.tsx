import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ClockCounterClockwise, Cloud, CloudArrowUp, GitBranch, HardDrives, Key, Package, PaintBrush, Pulse, type Icon } from '@phosphor-icons/react';
import { features, providers, stack } from './data';

/** Adds `is-on` once the element scrolls into view (instantly under reduced motion). */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('is-on'); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-on'); observer.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Deploy log: an illustration of the pipeline, typed line by line.    */
/* ------------------------------------------------------------------ */

const log: { kind: 'cmd' | 'ok' | 'run' | 'wait' | 'live'; tag: string; text: string }[] = [
  { kind: 'cmd', tag: '$', text: 'git push origin main' },
  { kind: 'ok', tag: 'git', text: 'module relié au dépôt · nouvelle version détectée' },
  { kind: 'run', tag: 'staging', text: 'déploiement sur une instance distincte de la production' },
  { kind: 'ok', tag: 'staging', text: 'modules à jour · prêt pour validation' },
  { kind: 'wait', tag: 'validation', text: 'en attente de votre feu vert' },
  { kind: 'ok', tag: 'production', text: 'mise à jour en un clic · sans toucher au serveur' },
  { kind: 'live', tag: 'sauvegarde', text: 'point de restauration créé' },
  { kind: 'live', tag: 'surveillance', text: 'disponibilité · processeur · mémoire · disque' },
];
const mark = { cmd: '›', ok: '✓', run: '▸', wait: '◌', live: '●' } as const;

export function DeployLog() {
  const ref = useInView<HTMLElement>();
  return (
    <figure className="term" ref={ref}>
      <div className="term-bar" aria-hidden="true"><span /><span /><span /><em>ozania.io · journal de déploiement</em></div>
      <pre className="term-body"><code>
        {log.map((line, i) => (
          <span key={i} className={`term-line is-${line.kind}`} style={{ '--i': i } as CSSProperties}>
            <span className="term-mark" aria-hidden="true">{mark[line.kind]}</span>
            <span className="term-tag">{line.tag}</span>
            <span className="term-text">{line.text}</span>
          </span>
        ))}
        <span className="term-caret" aria-hidden="true" />
      </code></pre>
      <figcaption>Illustration du flux, d’après les étapes de la console</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Feature bento: every capability, with real screenshots where useful. */
/* ------------------------------------------------------------------ */

const icons: Record<string, Icon> = {
  deploiement: CloudArrowUp, vps: HardDrives, heberge: Cloud, sauvegardes: ClockCounterClockwise,
  surveillance: Pulse, modules: Package, git: GitBranch, acces: Key, marque: PaintBrush,
};
const wide = new Set(['deploiement', 'modules', 'git']);
/** Details already stated in each feature's copy, shown as mono chips. */
const details: Record<string, { code?: string; chips?: string[] }> = {
  vps: { code: '$ ssh root@votre-serveur', chips: ['déployer', 'revenir en arrière', 'inspecter'] },
  heberge: { chips: ['provisionnement', 'correctifs', 'sécurité'] },
  sauvegardes: { chips: ['automatiques', 'redondantes', 'par date ou par serveur', 'restauration'] },
  acces: { chips: ['sauvegardes', 'redémarrages', 'journaux'] },
  marque: { chips: ['portail', 'domaine', 'votre logo', 'plan Agency'] },
};

export function FeatureBento() {
  return (
    <section className="bento-section" aria-labelledby="bento-title">
      <div className="bento-head" data-reveal>
        <p className="eyebrow">fonctionnalités</p>
        <h2 id="bento-title">Tout ce que la console gère,<br /><span>pour chaque instance Odoo.</span></h2>
        <p>Déploiement, staging, sauvegardes, surveillance, modules, Git, accès délégué et marque blanche : une seule couche de contrôle au-dessus de votre infrastructure.</p>
      </div>
      <ul className="bento">
        {features.map((feature) => {
          const FeatureIcon = icons[feature.id];
          const isWide = wide.has(feature.id);
          return (
            <li key={feature.id} className={`bento-card ${isWide ? 'is-wide' : ''}`}>
              <Link to={`/plateforme#${feature.id}`}>
                <span className="bento-top">
                  <span className="bento-icon" aria-hidden="true"><FeatureIcon size={22} weight="duotone" /></span>
                  <span className="bento-tag">{feature.group}</span>
                  <ArrowUpRight className="bento-arrow" size={20} aria-hidden="true" />
                </span>
                <h3>{feature.title}</h3>
                <span className="bento-lead">{feature.lead}</span>
                {isWide && feature.kind === 'ui' && (
                  <span className="bento-shot"><img src={feature.image} alt={feature.alt} loading="lazy" decoding="async" /></span>
                )}
                {details[feature.id] && (
                  <span className="bento-details" aria-hidden="true">
                    {details[feature.id].code && <code>{details[feature.id].code}</code>}
                    {details[feature.id].chips?.map((chip) => <span key={chip}>{chip}</span>)}
                  </span>
                )}
                {feature.id === 'surveillance' && (
                  <span className="bento-meter" aria-hidden="true">
                    {['disponibilité', 'processeur', 'mémoire', 'disque'].map((m, i) => <span key={m} style={{ '--i': i } as CSSProperties}><em>{m}</em><i /></span>)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stack matrix: every provider and tool, grouped.                     */
/* ------------------------------------------------------------------ */

const groups: { id: string; label: string; items: readonly string[] }[] = [
  { id: 'infra', label: 'Cloud et serveurs', items: providers },
  { id: 'code', label: 'Code', items: stack.filter((s) => ['Git', 'GitHub'].includes(s)) },
  { id: 'run', label: 'Exécution', items: stack.filter((s) => ['Docker', 'Ubuntu', 'PostgreSQL'].includes(s)) },
  { id: 'obs', label: 'Observabilité', items: stack.filter((s) => ['Grafana', 'Prometheus', 'cAdvisor'].includes(s)) },
  { id: 'odoo', label: 'Odoo', items: ['17', '18', '19', '20', 'Community', 'Enterprise'] },
];

export function StackMatrix() {
  const ref = useInView<HTMLElement>();
  return (
    <section className="stack-section" aria-labelledby="stack-title" ref={ref}>
      <div className="stack-head" data-reveal>
        <p className="eyebrow">infrastructure</p>
        <h2 id="stack-title">Vos outils, votre infrastructure.<br /><span>Une seule console.</span></h2>
      </div>
      <div className="stack-grid">
        {groups.map((group, g) => (
          <div key={group.id} className={`stack-group is-${group.id}`}>
            <h3><span aria-hidden="true">{String(g + 1).padStart(2, '0')}</span>{group.label}</h3>
            <ul>
              {group.items.map((item, i) => (
                <li key={item} style={{ '--i': i + g * 3 } as CSSProperties}><i aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
