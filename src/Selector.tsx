import { createContext, useCallback, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from '@phosphor-icons/react';
import { audiences, hostings, planById, recommend, type Audience, type Hosting, type PlanId } from './data';

/* The visitor's answers live in memory only and travel to /contact through the URL. */
type Finder = {
  audience: Audience | null; hosting: Hosting | null; delegated: boolean;
  setAudience: (a: Audience) => void; setHosting: (h: Hosting) => void; setDelegated: (d: boolean) => void;
};
const FinderContext = createContext<Finder | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [audience, setAudienceState] = useState<Audience | null>(null);
  const [hosting, setHostingState] = useState<Hosting | null>(null);
  const [delegated, setDelegatedState] = useState(false);
  const setAudience = useCallback((a: Audience) => setAudienceState(a), []);
  const setHosting = useCallback((h: Hosting) => setHostingState(h), []);
  const setDelegated = useCallback((d: boolean) => setDelegatedState(d), []);
  const value = useMemo(() => ({ audience, hosting, delegated, setAudience, setHosting, setDelegated }), [audience, hosting, delegated, setAudience, setHosting, setDelegated]);
  return <FinderContext.Provider value={value}>{children}</FinderContext.Provider>;
}
export function useFinder() {
  const finder = useContext(FinderContext);
  if (!finder) throw new Error('useFinder outside ScopeProvider');
  return finder;
}

export function contactLink(plan?: PlanId | null, hosting?: Hosting | null) {
  const params = new URLSearchParams();
  if (plan) params.set('offre', plan);
  if (hosting) params.set('hebergement', hosting);
  const query = params.toString();
  return query ? `/contact?${query}` : '/contact';
}

const environments = [
  { id: 'test', label: 'Test' },
  { id: 'staging', label: 'Staging' },
  { id: 'production', label: 'Production' },
] as const;
const envFor: Record<PlanId, string[]> = { discovery: ['test', 'staging'], solo: ['test', 'staging', 'production'], integrator: ['test', 'staging', 'production'], agency: ['test', 'staging', 'production'] };

function Choice<T extends string>({ name, legend, options, value, onChange, columns = 2 }: { name: string; legend: string; options: { id: T; label: string; hint?: string }[]; value: T | null; onChange: (v: T) => void; columns?: number }) {
  return (
    <fieldset className="finder-question">
      <legend>{legend}</legend>
      <div className="finder-options" style={{ ['--cols' as string]: columns }}>
        {options.map((option) => (
          <label key={option.id} className={`finder-option ${value === option.id ? 'on' : ''}`}>
            <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
            <span className="finder-dot" aria-hidden="true">{value === option.id && <Check size={11} weight="bold" />}</span>
            <span className="finder-text"><strong>{option.label}</strong>{option.hint && <small>{option.hint}</small>}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Signature interaction: three answers, one recommended plan, carried to the contact form. */
export function PlanFinder({ compact = false, id }: { compact?: boolean; id?: string }) {
  const { audience, hosting, delegated, setAudience, setHosting, setDelegated } = useFinder();
  const planId = recommend(audience, delegated);
  const plan = planId ? planById[planId] : null;
  const hostingInfo = hostings.find((h) => h.id === hosting);
  const headingId = useId();
  const name = useId();
  const active = planId ? envFor[planId] : [];

  return (
    <section className={`finder ${compact ? 'finder-compact' : ''}`} id={id} aria-labelledby={headingId}>
      <div className="finder-head">
        <h2 id={headingId}>{compact ? <>Quel plan pour vous ?<br /><span>Trois questions, une réponse.</span></> : <>Trouvez votre plan<br /><span>en trois questions.</span></>}</h2>
        <p>Vos réponses ne sont enregistrées nulle part. Elles servent à vous orienter, et peuvent accompagner votre demande de compte.</p>
      </div>

      <div className="finder-body">
        <form className="finder-form" onSubmit={(event) => event.preventDefault()}>
          <Choice name={`${name}-a`} legend="1. Vous faites tourner Odoo pour…" options={audiences} value={audience} onChange={setAudience} />
          <Choice name={`${name}-h`} legend="2. Où tournent vos serveurs ?" options={hostings.map((h) => ({ id: h.id, label: h.label }))} value={hosting} onChange={setHosting} />
          <fieldset className="finder-question">
            <legend>3. L’équipe informatique d’un client doit-elle intervenir elle-même ?</legend>
            <label className={`finder-switch ${delegated ? 'on' : ''}`}>
              <input type="checkbox" role="switch" checked={delegated} onChange={(event) => setDelegated(event.target.checked)} />
              <span className="switch-track" aria-hidden="true"><span /></span>
              <span>{delegated ? 'Oui : sauvegardes, redémarrages et journaux en libre-service' : 'Non, mon équipe s’en charge'}</span>
            </label>
          </fieldset>
        </form>

        <div className={`finder-result ${plan ? 'has-plan' : ''}`} aria-live="polite">
          <div className="console-chrome" aria-hidden="true"><span /><span /><span /><em>console.ozania.io</em></div>
          <div className="finder-envs" aria-label="Environnements inclus">
            {environments.map((env, index) => (
              <span key={env.id} className={`env ${active.includes(env.id) ? 'on' : ''}`} style={{ transitionDelay: `${index * 90}ms` }}>
                <i aria-hidden="true" />{env.label}
                <span className="sr-only">{active.includes(env.id) ? ' : inclus' : ' : non inclus'}</span>
              </span>
            ))}
          </div>
          {plan ? (
            <div className="finder-plan" key={plan.id}>
              <p className="finder-plan-name">Plan conseillé <strong>{plan.name}</strong></p>
              <p className="finder-price">{plan.price}<small>{plan.priceNote}</small></p>
              <ul className="tick-list">{plan.features.slice(0, compact ? 4 : 7).map((f) => <li key={f}>{f}</li>)}</ul>
              {hostingInfo && <p className="finder-hosting"><strong>{hostingInfo.label}.</strong> {hostingInfo.detail}</p>}
              <div className="finder-actions">
                <Link className="button button-primary" to={contactLink(plan.id, hosting)}><span>{plan.id === 'discovery' ? 'Demander mon compte gratuit' : `Demander le plan ${plan.name}`}</span><ArrowUpRight size={20} aria-hidden="true" /></Link>
                {compact && <Link className="text-link" to="/tarifs#comparatif"><span>Comparer les plans</span><ArrowUpRight size={18} aria-hidden="true" /></Link>}
              </div>
            </div>
          ) : (
            <p className="finder-empty">Répondez à la première question pour voir le plan qui vous correspond.</p>
          )}
          <p className="finder-note">L’hébergement des serveurs n’est pas inclus dans les plans : apportez le vôtre, ou ajoutez l’hébergement géré Ozania depuis votre tableau de bord.</p>
        </div>
      </div>
    </section>
  );
}
