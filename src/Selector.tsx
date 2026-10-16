import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, ArrowCounterClockwise } from '@phosphor-icons/react';
import { apps, lanes, needGroups, needs, scopeFor, type AppId, type NeedId } from './data';

/* Selected needs live in memory only (never in browser storage) and travel to /contact through the URL. */
type Scope = { selected: NeedId[]; toggle: (id: NeedId) => void; set: (ids: NeedId[]) => void; clear: () => void };
const ScopeContext = createContext<Scope | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<NeedId[]>([]);
  const toggle = useCallback((id: NeedId) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])), []);
  const set = useCallback((ids: NeedId[]) => setSelected([...new Set(ids)]), []);
  const clear = useCallback(() => setSelected([]), []);
  const value = useMemo(() => ({ selected, toggle, set, clear }), [selected, toggle, set, clear]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}
export function useScope() {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error('useScope outside ScopeProvider');
  return scope;
}
export const contactLink = (ids: readonly string[]) => (ids.length ? `/contact?besoins=${ids.join(',')}` : '/contact');

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

type Path = { key: string; d: string };

/** Map of Odoo applications in three lanes; active flows are drawn between the nodes. */
function FlowMap({ active, activeFlows }: { active: Set<AppId>; activeFlows: ReturnType<typeof scopeFor>['flows'] }) {
  const box = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<AppId, HTMLElement>());
  const [geometry, setGeometry] = useState<{ w: number; h: number; rects: Map<AppId, DOMRect> } | null>(null);
  const reduced = useReducedMotion();
  const titleId = useId();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const rects = new Map<AppId, DOMRect>();
      nodes.current.forEach((node, id) => { const r = node.getBoundingClientRect(); rects.set(id, new DOMRect(r.left - base.left, r.top - base.top, r.width, r.height)); });
      setGeometry({ w: base.width, h: base.height, rects });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, []);

  const paths: Path[] = useMemo(() => {
    if (!geometry) return [];
    return activeFlows.flatMap((flow) => {
      const a = geometry.rects.get(flow.from), b = geometry.rects.get(flow.to);
      if (!a || !b) return [];
      const sameLane = Math.abs(a.x - b.x) < 8;
      if (sameLane) {
        const x = a.right, y1 = a.y + a.height / 2, y2 = b.y + b.height / 2;
        const bulge = Math.min(64, 22 + Math.abs(y2 - y1) * 0.25);
        return [{ key: `${flow.from}-${flow.to}`, d: `M ${x} ${y1} C ${x + bulge} ${y1}, ${x + bulge} ${y2}, ${x} ${y2}` }];
      }
      const [left, right] = a.x < b.x ? [a, b] : [b, a];
      const x1 = left.right, y1 = left.y + left.height / 2, x2 = right.x, y2 = right.y + right.height / 2;
      const mid = (x1 + x2) / 2;
      return [{ key: `${flow.from}-${flow.to}`, d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}` }];
    });
  }, [activeFlows, geometry]);

  return (
    <div className="flow-map" ref={box}>
      <svg className="flow-lines" width={geometry?.w || 0} height={geometry?.h || 0} aria-hidden="true" focusable="false">
        {paths.map((path, index) => (
          <g key={path.key}>
            <path d={path.d} className="flow-line" pathLength={1} style={{ animationDelay: `${index * 60}ms` }} />
            {!reduced && <circle r="3" className="flow-pulse"><animateMotion dur={`${3.6 + (index % 3) * 0.7}s`} repeatCount="indefinite" path={path.d} begin={`${(index % 4) * 0.5}s`} /></circle>}
          </g>
        ))}
      </svg>
      {lanes.map((lane) => {
        const laneApps = apps.filter((app) => app.lane === lane.id);
        return (
          <div className="flow-lane" key={lane.id}>
            <p className="flow-lane-title" id={`${titleId}-${lane.id}`}><strong>{lane.label}</strong><span>{lane.hint}</span></p>
            <ul aria-labelledby={`${titleId}-${lane.id}`}>
              {laneApps.map((app) => {
                const on = active.has(app.id);
                return (
                  <li key={app.id} ref={(node) => { if (node) nodes.current.set(app.id, node); else nodes.current.delete(app.id); }} className={`flow-node ${on ? 'on' : ''}`}>
                    <span className="flow-node-name">{app.name}</span>
                    <span className="sr-only">{on ? ' : incluse dans votre périmètre' : ' : non sélectionnée'}</span>
                    <span className="flow-node-role">{app.role}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function NeedSelector({ compact = false, id }: { compact?: boolean; id?: string }) {
  const { selected, toggle, clear } = useScope();
  const scope = useMemo(() => scopeFor(selected), [selected]);
  const active = useMemo(() => new Set(scope.apps.map((app) => app.id)), [scope]);
  const headingId = useId();
  const summaryId = useId();
  const limit = compact ? 3 : 6;
  const rest = scope.flows.length - limit;

  return (
    <section className={`selector ${compact ? 'selector-compact' : ''}`} id={id} aria-labelledby={headingId}>
      <div className="selector-head">
        <h2 id={headingId}>{compact ? <>Par où commencer ?<br /><span>Choisissez ce qui vous freine.</span></> : <>Le fil de vos opérations.</>}</h2>
        <p>{compact
          ? 'Chaque besoin active les applications Odoo concernées et les liaisons qui évitent la ressaisie. Le périmètre obtenu peut accompagner votre demande.'
          : 'Sélectionnez vos besoins. Les applications Odoo qui y répondent s’allument, et les informations qu’elles se transmettent apparaissent. C’est un point de départ pour la discussion, pas un devis.'}</p>
      </div>

      <div className="selector-body">
        <div className="need-groups" role="group" aria-label="Vos besoins" aria-describedby={summaryId}>
          {needGroups.map((group) => (
            <div className="need-group" key={group.id}>
              <p className="need-group-title">{group.label}</p>
              <div className="need-list">
                {needs.filter((need) => need.group === group.id).map((need) => {
                  const on = selected.includes(need.id);
                  return (
                    <button type="button" key={need.id} className={`need ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(need.id)}>
                      <span className="need-check" aria-hidden="true">{on && <Check size={13} weight="bold" />}</span>
                      <span className="need-text"><strong>{need.label}</strong>{!compact && <small>{need.pain}</small>}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="selector-stage">
          <FlowMap active={active} activeFlows={scope.flows} />
          <div className="selector-summary" id={summaryId}>
            <div className="summary-counts" aria-live="polite">
              {selected.length ? (
                <p><strong>{selected.length}</strong> besoin{selected.length > 1 ? 's' : ''} · <strong>{scope.apps.length}</strong> application{scope.apps.length > 1 ? 's' : ''} · <strong>{scope.flows.length}</strong> liaison{scope.flows.length > 1 ? 's' : ''}</p>
              ) : (
                <p>Aucun besoin sélectionné. Choisissez-en un pour voir les applications et leurs liaisons apparaître.</p>
              )}
            </div>
            {scope.flows.length > 0 && (
              <ul className="summary-flows">
                {scope.flows.slice(0, limit).map((flow) => <li key={`${flow.from}-${flow.to}`}><span>{apps.find((a) => a.id === flow.from)?.name} → {apps.find((a) => a.id === flow.to)?.name}</span>{flow.label}</li>)}
                {rest > 0 && <li className="summary-more">et {rest} autre{rest > 1 ? 's' : ''} liaison{rest > 1 ? 's' : ''}</li>}
              </ul>
            )}
            <div className="summary-actions">
              <Link className="button button-primary" to={contactLink(selected)}>
                <span>{selected.length ? 'Préparer ma demande avec ce périmètre' : 'Préparer une demande'}</span><ArrowUpRight size={20} aria-hidden="true" />
              </Link>
              {selected.length > 0 && <button type="button" className="text-button" onClick={clear}><ArrowCounterClockwise size={16} aria-hidden="true" />Tout effacer</button>}
              {compact && <Link to="/vos-enjeux#selecteur" className="text-link"><span>Voir le détail par besoin</span><ArrowUpRight size={18} aria-hidden="true" /></Link>}
            </div>
            <p className="summary-note">Les liaisons décrites sont des usages courants d’Odoo. Leur mise en œuvre dépend de votre édition et de votre configuration.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
