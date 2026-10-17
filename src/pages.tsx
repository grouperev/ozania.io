import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowUpRight, Check, MagnifyingGlass, Minus } from '@phosphor-icons/react';
import { Action, Closing, Faq, Figure, PageHero, TextLink } from './components';
import { PlanFinder, contactLink } from './Selector';
import { DeployLog, FeatureBento, StackMatrix } from './devops';
import { benefits, company, comparison, deployOptions, faqs, features, homeFaqs, pipeline, plans, problems, providers, stack } from './data';

const pad = (n: number) => String(n).padStart(2, '0');

/** A real console screenshot in a light window frame. */
function Shot({ src, alt, ratio, className = '' }: { src: string; alt: string; ratio: string; className?: string }) {
  return (
    <figure className={`shot ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{ aspectRatio: ratio }} />
      <figcaption>Capture de la console Ozania.io</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */

/** Commit → staging → validation → production; the rail fills as the section scrolls. */
function Pipeline() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const steps = gsap.utils.toArray<HTMLElement>('.pipe-step', el);
      gsap.set(el, { '--fill': 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.pipe-track'), start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
      tl.to(el, { '--fill': 1, ease: 'none', duration: 1 }, 0);
      steps.forEach((step, i) => tl.fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 0.12, ease: 'none' }, (i / steps.length) * 0.9));
    });
    return () => mm.revert();
  }, []);
  return (
    <section className="pipeline" ref={root} aria-labelledby="pipeline-title">
      <div className="pipeline-head" data-reveal>
        <h2 id="pipeline-title">Du commit à la production,<br /><span>sans toucher au serveur.</span></h2>
        <p>Chaque déploiement passe d’abord par le staging. Rien ne part en production sans votre feu vert, et chaque étape est sauvegardée et surveillée.</p>
      </div>
      <div className="pipe-track">
        <span className="pipe-rail" aria-hidden="true"><span /></span>
        <ol className="pipe-steps">
          {pipeline.map((step, index) => (
            <li key={step.id} className="pipe-step">
              <span className="pipe-node" aria-hidden="true">{index === pipeline.length - 1 ? <Check size={14} weight="bold" /> : pad(index + 1)}</span>
              <strong>{step.label}</strong>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="pipe-bottom">
          <div className="pipe-lanes" aria-label="En continu sur chaque instance">
            <p><span aria-hidden="true" />Sauvegardes automatiques et redondantes</p>
            <p><span aria-hidden="true" />Surveillance de la disponibilité, du processeur, de la mémoire et du disque</p>
            <p><span aria-hidden="true" />Accès SSH complet conservé sur vos propres serveurs</p>
          </div>
          <DeployLog />
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="hero-top"><p className="eyebrow">La console DevOps pour Odoo</p><p className="hero-aside">Odoo 17 à 20 · Community et Enterprise</p></div>
        <h1>Arrêtez de gérer vos serveurs.<br /><span>Commencez à gérer Odoo.</span></h1>
        <div className="hero-actions">
          <Action to={contactLink('discovery')}>Demander mon compte gratuit</Action>
          <p>Ozania.io vous permet de déployer, valider et orchestrer tous vos environnements Odoo depuis une seule interface, sur vos serveurs ou les nôtres.</p>
          <TextLink to="/plateforme">Voir la plateforme</TextLink>
        </div>
        <figure className="hero-image">
          <div className="hero-image-frame">
            <picture>
              <source media="(max-width: 700px)" srcSet="/images/team-console-mobile.webp" width={820} height={774} />
              <img src="/images/team-console.webp" alt="Illustration : deux ingénieurs examinent un tableau de bord de serveurs sur deux grands écrans, dans un bureau lumineux aux rideaux violets." width={1920} height={1072} fetchPriority="high" data-parallax />
            </picture>
          </div>
          <figcaption className="hero-ui">
            <img src="/images/ui/servers.webp" alt="Capture de la console Ozania.io : sept serveurs chez Ozania, Hetzner, AWS, Azure, OVH, Hostinger et DigitalOcean, tous prêts." width={1744} height={782} />
          </figcaption>
        </figure>
        <p className="image-note"><span>Visuel d’illustration · capture réelle de la console</span><span>Déploiement · staging · sauvegardes · surveillance</span></p>
      </section>

      <section className="infra" aria-label="Infrastructures et outils compatibles">
        <p>Vos fournisseurs, votre infrastructure</p>
        <div className="infra-marquee">
          <ul className="infra-providers">{providers.map((p) => <li key={p}>{p}</li>)}</ul>
          <ul className="infra-providers" aria-hidden="true">{providers.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <ul className="infra-stack">{stack.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>

      <Pipeline />

      <section className="problem">
        <div className="problem-head" data-reveal>
          <h2>Votre infrastructure vous coûte plus cher<br /><span>que ce que votre facture indique.</span></h2>
          <p>Pour un intégrateur Odoo, chaque projet s’accompagne d’une charge d’infrastructure rarement facturée, qui grandit avec l’usage.</p>
        </div>
        <ol className="problem-list">
          {problems.map((problem, index) => (
            <li key={problem.title} data-reveal>
              <span className="problem-number" aria-hidden="true">{pad(index + 1)}</span>
              <h3>{problem.title}</h3>
              <p>{problem.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <FeatureBento />
      <StackMatrix />

      <section className="why">
        <Figure src="/images/team-release.webp" alt="Illustration : une équipe d’intégrateurs suit sur un écran mural le passage d’une mise à jour du staging à la production." ratio="21 / 9" position="center 55%" parallax className="why-photo" caption="Visuel d’illustration" />
        <div className="why-body">
          <h2 data-reveal>Construit par une équipe qui gère<br /><span>des pipelines DevOps depuis 20 ans.</span></h2>
          <dl className="why-facts">
            <div data-reveal><dt>Certifié Odoo</dt><dd>Versions 17, 18 et 19</dd></div>
            <div data-reveal><dt>Odoo pris en charge</dt><dd>17 à 20, Community et Enterprise</dd></div>
            <div data-reveal><dt>Support</dt><dd>En {company.languages}</dd></div>
            <div data-reveal><dt>Vos données</dt><dd>Restent sur vos serveurs</dd></div>
          </dl>
        </div>
      </section>

      <PlanFinder compact id="quel-plan" />
      <Faq items={homeFaqs} title="Questions fréquentes." />
      <Closing title={<>Prêt à rendre votre<br />infrastructure efficace ?</>} text="Créez votre compte Discovery gratuit, et passez en production quand vous êtes prêt." to={contactLink('discovery')} label="Demander mon compte gratuit" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Platform                                                           */
/* ------------------------------------------------------------------ */

function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`);
  window.dispatchEvent(new CustomEvent('oz:scrollto', { detail: target }));
  const heading = target.querySelector<HTMLElement>('h2, h3');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}

export function PlatformPage() {
  const [current, setCurrent] = useState<string>(features[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent(visible.target.id);
    }, { rootMargin: '-35% 0px -55% 0px' });
    features.forEach((f) => { const el = document.getElementById(f.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <PageHero label="La plateforme" title={<>Une couche de contrôle.<br /><span>Toute infrastructure.</span></>} text="Cloud, serveur dédié ou serveur géré par Ozania : vous retrouvez le même flux de déploiement, de surveillance et de sauvegarde pour chaque client et chaque instance.">
        <Action to={contactLink('discovery')}>Demander mon compte gratuit</Action>
        <TextLink to="/tarifs">Voir les tarifs</TextLink>
      </PageHero>

      <section className="options" id="options" aria-labelledby="options-title">
        <div className="options-head" data-reveal>
          <h2 id="options-title">Trois façons de faire tourner Odoo.<br /><span>Un seul flux de travail.</span></h2>
          <p>Vous choisissez où vivent vos serveurs. Ozania.io s’occupe de leur gestion.</p>
        </div>
        <ol className="options-list">
          {deployOptions.map((option) => (
            <li key={option.id} data-reveal>
              <span className="option-label">{option.label}</span>
              <h3>{option.title}</h3>
              <p>{option.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="expertise-layout">
        <nav className="expertise-nav" aria-label="Fonctionnalités">
          <ol>
            {features.map((feature) => (
              <li key={feature.id}><a href={`#${feature.id}`} aria-current={current === feature.id ? 'true' : undefined} onClick={(event) => { event.preventDefault(); scrollToId(feature.id); }}><span>{feature.group}</span>{feature.lead}</a></li>
            ))}
          </ol>
        </nav>
        <div className="expertise-articles">
          {features.map((feature, index) => (
            <article id={feature.id} key={feature.id} className={`expertise-article layout-${feature.kind === 'photo' ? 2 : index % 2}`}>
              <div className="article-head" data-reveal>
                <span className="article-kicker">{feature.group}</span>
                <h2>{feature.title}</h2>
                <p className="article-lead">{feature.lead}</p>
              </div>
              {feature.kind === 'ui'
                ? <Shot src={feature.image} alt={feature.alt} ratio={feature.ratio} />
                : <Figure src={feature.image} alt={feature.alt} ratio={feature.ratio} position="center 45%" caption="Visuel d’illustration" />}
              <div className="article-body" data-reveal><p>{feature.text}</p></div>
            </article>
          ))}
        </div>
      </div>

      <section className="benefits" aria-labelledby="benefits-title">
        <h2 id="benefits-title" data-reveal>La couche opérationnelle<br /><span>qui manquait.</span></h2>
        <dl>
          {benefits.map((b) => <div key={b.title} data-reveal><dt>{b.title}</dt><dd>{b.text}</dd></div>)}
        </dl>
      </section>

      <Closing title={<>Prêt à gérer tous vos clients<br />depuis une seule console ?</>} text="Créez votre compte Discovery gratuit, et passez en production quand vous êtes prêt." to={contactLink('discovery')} label="Demander mon compte gratuit" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                            */
/* ------------------------------------------------------------------ */

function Cell({ value }: { value: string }) {
  if (value === 'oui') return <><Check size={18} weight="bold" aria-hidden="true" /><span className="sr-only">Inclus</span></>;
  if (value === 'non') return <><Minus size={18} aria-hidden="true" /><span className="sr-only">Non inclus</span></>;
  return <>{value}</>;
}

export function PricingPage() {
  return (
    <>
      <PageHero label="Tarifs" title={<>Commencez gratuitement.<br /><span>Passez en production quand vous êtes prêt.</span></>} text="Un abonnement fixe, indépendant du nombre d’utilisateurs. Trois façons de faire tourner Odoo, un seul partenaire pour les trois." />

      <section className="plans" id="plans" aria-label="Plans">
        <ul className="plan-grid">
          {plans.map((plan) => (
            <li key={plan.id} id={`plan-${plan.id}`} className={`plan ${plan.highlight ? 'plan-highlight' : ''}`}>
              {plan.highlight && <p className="plan-badge">Le plus choisi par les intégrateurs</p>}
              <h2>{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <p className="plan-price">{plan.price}<small>{plan.priceNote}</small></p>
              <ul className="tick-list">{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <Link className={`button ${plan.highlight ? 'button-light' : 'button-primary'}`} to={contactLink(plan.id)}><span>{plan.id === 'discovery' ? 'Demander mon compte gratuit' : 'Commencer maintenant'}</span><ArrowUpRight size={20} aria-hidden="true" /></Link>
            </li>
          ))}
        </ul>
        <p className="plans-note">Prix en dinars algériens. L’hébergement des serveurs n’est pas inclus : apportez le vôtre, ou ajoutez l’hébergement géré Ozania depuis votre tableau de bord à tout moment.</p>
      </section>

      <PlanFinder id="trouver" />

      <section className="compare" id="comparatif" aria-labelledby="compare-title">
        <h2 id="compare-title" data-reveal>Comparez les quatre plans.</h2>
        <div className="compare-scroll" tabIndex={0} role="region" aria-label="Tableau comparatif, défilable horizontalement sur petit écran">
          <table>
            <caption className="sr-only">Comparatif des plans Discovery, Solo, Integrator et Agency</caption>
            <thead><tr><th scope="col">Caractéristique</th>{plans.map((p) => <th scope="col" key={p.id} className={p.highlight ? 'is-highlight' : ''}>{p.name}</th>)}</tr></thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((v, i) => <td key={i} className={plans[i].highlight ? 'is-highlight' : ''}><Cell value={v} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div id="questions"><Faq items={faqs} title="Questions fréquentes." /></div>
      <Closing title={<>Commencez par un compte<br />Discovery gratuit.</>} text="90 jours pour construire votre projet Odoo avec des environnements de test et de pré-production." to={contactLink('discovery')} label="Demander mon compte gratuit" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                              */
/* ------------------------------------------------------------------ */

const values = [
  { title: 'Contrôle', text: 'Vos serveurs, vos données, votre accès SSH. Rien n’est verrouillé, et vos instances continuent de tourner si vous partez.' },
  { title: 'Prévisibilité', text: 'Un abonnement fixe, indépendant du nombre d’utilisateurs. Pas de facture qui grandit avec l’usage.' },
  { title: 'Sécurité', text: 'Secrets chiffrés, accès fondé sur des rôles, actions journalisées.' },
  { title: 'Proximité', text: `Un support en ${company.languages}, par e-mail, et sur WhatsApp pour le support prioritaire.` },
];

export function AboutPage() {
  return (
    <>
      <PageHero label="À propos" title={<>La couche DevOps d’Odoo.<br /><span>Au sein du groupe Ozania.</span></>} text="Ozania.io est née d’une équipe qui gère des pipelines DevOps depuis vingt ans. Son objectif : rendre aux intégrateurs Odoo le temps que leur prend l’infrastructure.">
        <Action to={contactLink('discovery')}>Demander mon compte gratuit</Action>
      </PageHero>

      <section className="about-story">
        <Figure src="/images/team-low-angle.webp" alt="Illustration : quatre collègues penchés sur une tablette autour d’une table ronde, près d’une haute fenêtre en arche." ratio="4 / 5" position="center 40%" caption="Visuel d’illustration. Ne représente pas l’équipe d’Ozania.io." />
        <div className="about-copy" data-reveal>
          <h2>Pourquoi une console<br /><span>dédiée à Odoo ?</span></h2>
          <p>Pour un intégrateur, chaque nouveau client ramène le même travail : préparer un serveur, déployer, sauvegarder, surveiller, mettre à jour les modules. Ce temps est rarement facturé, et il grandit avec chaque projet.</p>
          <p>Ozania.io automatise cette couche, au-dessus de serveurs qui restent les vôtres. Vous gardez le choix du fournisseur, l’accès complet et vos données ; la console vous rend le reste du temps.</p>
        </div>
      </section>

      <section className="values" aria-labelledby="values-title">
        <h2 id="values-title" data-reveal>Ce sur quoi<br /><span>vous pouvez compter.</span></h2>
        <dl>{values.map((v) => <div key={v.title} data-reveal><dt>{v.title}</dt><dd>{v.text}</dd></div>)}</dl>
      </section>

      <section className="group-statement group-statement-about">
        <p className="statement" data-reveal>Ozania.io et Ozania.com appartiennent au même groupe. <span>Ozania.io fournit la console DevOps ; Ozania.com accompagne le développement et le support de vos projets Odoo.</span></p>
        <a className="text-link" href={company.servicesUrl} target="_blank" rel="noopener noreferrer"><span>Découvrir Ozania.com</span><ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only"> (nouvel onglet)</span></a>
      </section>

      <Closing title={<>Une question avant de vous lancer ?<br />Écrivez-nous.</>} text={`Notre équipe répond en ${company.languages}.`} to="/contact" label="Nous contacter" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy and 404                                                    */
/* ------------------------------------------------------------------ */

export function PrivacyPage() {
  const sections: [string, string[]][] = [
    ['Ce que fait le formulaire', ['Le formulaire de contact vous aide à préparer une demande. Il ne transmet rien lui-même : il met en forme votre message, que vous pouvez copier, télécharger ou ouvrir dans votre propre messagerie pour l’envoyer à ' + company.email + '.', 'Si un envoi direct est activé plus tard, cette page sera mise à jour avant l’activation, avec le prestataire d’envoi concerné.']],
    ['Les informations saisies', ['Nom, entreprise, adresse e-mail, téléphone facultatif, plan choisi, hébergement envisagé et message. Elles restent dans la mémoire de votre navigateur le temps de votre visite.', 'Elles ne sont enregistrées ni dans le stockage local du navigateur, ni dans un cookie, ni sur un serveur du site.']],
    ['Cookies et mesure d’audience', ['Ce site vitrine ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience ou de publicité.']],
    ['Ressources externes', ['Les polices de caractères et les images sont servies par le site lui-même. Les liens vers la console et vers Ozania.com mènent à d’autres sites, qui ont leurs propres règles.']],
    ['La console Ozania.io', ['Les données de vos instances Odoo restent sur vos serveurs : la plateforme n’héberge pas vos bases de données. Les identifiants de serveur sont chiffrés, l’accès repose sur des rôles et les actions sont journalisées.']],
    ['Vos droits', ['Conformément à la réglementation applicable, vous pouvez demander l’accès, la rectification ou la suppression des informations que vous nous avez transmises en écrivant à ' + company.email + '.']],
  ];
  return (
    <>
      <PageHero label="Confidentialité" title={<>Vos informations,<br /><span>simplement expliquées.</span></>} text="Ce que devient ce que vous saisissez sur ce site, sans détour." />
      <div className="prose-page">
        <p className="prose-note">Les mentions légales complètes (raison sociale, siège, hébergeur du site) seront ajoutées avant l’ouverture publique du site.</p>
        {sections.map(([title, paragraphs]) => (
          <section key={title}>
            <h2>{title}</h2>
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <p><Link className="inline-link" to="/contact">Revenir au formulaire de contact</Link></p>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="not-found-code" aria-hidden="true">404</p>
      <div className="not-found-copy">
        <p className="eyebrow">Page introuvable</p>
        <h1>Cette instance<br /><span>ne répond pas.</span></h1>
        <p className="lede">La page a peut-être été déplacée, ou l’adresse contient une erreur. Voici de quoi reprendre la main.</p>
        <ul className="not-found-links">
          {[['Accueil', '/'], ['La plateforme', '/plateforme'], ['Tarifs', '/tarifs'], ['Contact', '/contact']].map(([label, to]) => <li key={to}><Link to={to}><span>{label}</span><ArrowUpRight size={20} aria-hidden="true" /></Link></li>)}
        </ul>
        <button type="button" className="button button-outline" onClick={() => window.dispatchEvent(new Event('oz:search'))}><span>Rechercher sur le site</span><MagnifyingGlass size={20} aria-hidden="true" /></button>
      </div>
    </section>
  );
}

