import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react';
import { Action, Closing, Faq, Figure, PageHero, TextLink, onTabKey } from './components';
import { NeedSelector, useScope } from './Selector';
import { apps, fragments, generalFaqs, journeyFaqs, lanes, needById, phases, principles, sectors, services } from './data';

const pad = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */

/** Scattered tools settle into one ordered column as the section scrolls into view. */
function Gather() {
  const board = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const items = gsap.utils.toArray<HTMLElement>('li', el);
      const scatter = [[-48, 30, -5], [56, -12, 4], [-20, 44, 3], [40, 20, -4], [-56, -8, 5], [28, 36, -3]];
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 38%', scrub: 0.6 } });
      items.forEach((item, i) => {
        const [x, y, r] = scatter[i % scatter.length];
        tl.from(item, { x, y, rotation: r, ease: 'power2.out', duration: 1 }, 0);
        tl.from(item.querySelectorAll('.frag-arrow, .frag-app'), { opacity: 0, x: -12, duration: 0.45, ease: 'power1.out' }, 0.55);
      });
    });
    return () => mm.revert();
  }, []);
  return (
    <section className="gather">
      <div className="gather-copy" data-reveal>
        <h2>Vos informations existent déjà.<br /><span>Elles sont simplement dispersées.</span></h2>
        <p>Un fichier pour les clients, un autre pour le stock, des devis recopiés en facture. Chaque outil fonctionne, mais rien ne circule. Odoo réunit ces pièces dans un même système, où chaque information n’est saisie qu’une fois.</p>
        <TextLink to="/expertise-odoo">Ce que recouvre l’intégration</TextLink>
      </div>
      <ol className="gather-board" ref={board} aria-label="Outils dispersés et application Odoo qui peut les reprendre">
        {fragments.map((fragment) => (
          <li key={fragment.app}>
            <span className="frag-before">{fragment.before}</span>
            <span className="frag-arrow" aria-hidden="true" />
            <span className="frag-app"><span className="sr-only">repris par </span>{fragment.app}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Service index: the image follows the hovered or focused row. */
function ServiceIndex() {
  const [active, setActive] = useState(0);
  return (
    <section className="service-index">
      <h2 data-reveal>Six savoir-faire<br /><span>pour un Odoo réellement utilisé.</span></h2>
      <div className="service-index-body">
        <ol className="service-rows">
          {services.map((service, index) => (
            <li key={service.id}>
              <Link to={`/expertise-odoo#${service.id}`} className={active === index ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)}>
                <span className="row-number">{pad(index + 1)}</span>
                <span className="row-title">{service.title}</span>
                <span className="row-lead">{service.lead}</span>
                <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <div className="service-visual" aria-hidden="true">
          {services.map((service, index) => <img key={service.id} src={service.image} alt="" loading="lazy" className={active === index ? 'is-active' : ''} />)}
          <p className="service-visual-caption">{services[active].lead}</p>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-top"><p className="eyebrow">Intégration Odoo pour les entreprises</p><p className="hero-aside">Une société du groupe Ozania</p></div>
        <h1>Odoo, à la mesure<br /><span>de votre entreprise.</span></h1>
        <div className="hero-actions">
          <Action>Parlons de votre projet</Action>
          <p>Reliez vos équipes, vos données et vos processus autour d’un outil adapté à votre quotidien. Du cadrage à l’adoption, nous avançons avec vous.</p>
        </div>
        <figure className="hero-image">
          <div className="hero-image-frame">
            <picture>
              <source media="(max-width: 700px)" srcSet="/images/team-mobile.webp" width={800} height={899} />
              <img src="/images/team-collaboration.webp" alt="Illustration : quatre collègues échangent autour d’un ordinateur portable sur une grande table claire, sous une arche ouverte sur la mer." width={1672} height={941} fetchPriority="high" data-parallax />
            </picture>
          </div>
          <figcaption className="hero-label">
            <span>Un seul outil.<br />Une vue d’ensemble.</span>
            <Link to="/vos-enjeux#selecteur" className="round-button" aria-label="Composer votre périmètre Odoo"><ArrowUpRight size={24} aria-hidden="true" /></Link>
          </figcaption>
        </figure>
        <p className="image-note"><span>Visuel d’illustration</span><span>Ventes, stock, finance, projets, équipes</span></p>
      </section>

      <Gather />
      <NeedSelector compact id="par-ou-commencer" />
      <ServiceIndex />

      <section className="journey-band">
        <Figure src="/images/team-workshop.webp" alt="Illustration : une équipe dessine l’enchaînement de ses processus sur un mur blanc, dans une cour à arcades." ratio="21 / 9" position="center 42%" parallax className="journey-band-photo" />
        <div className="journey-band-copy" data-reveal>
          <h2>De la première question<br /><span>à l’autonomie de vos équipes.</span></h2>
          <TextLink to="/accompagnement">Découvrir notre accompagnement</TextLink>
        </div>
        <ol className="journey-steps">
          {phases.map((phase, index) => (
            <li key={phase.id} data-reveal style={{ '--i': index } as CSSProperties}>
              <Link to={`/accompagnement?etape=${phase.id}#etapes`}>
                <span className="step-number">{pad(index + 1)}</span>
                <strong>{phase.label}</strong>
                <span>{phase.result}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="group-statement">
        <p className="statement" data-reveal>Une société dédiée à Odoo, au sein du groupe Ozania. <span>Une seule spécialité, pour lui consacrer toute l’attention qu’un projet d’intégration demande.</span></p>
        <TextLink to="/a-propos">Mieux nous connaître</TextLink>
      </section>

      <Faq items={generalFaqs} />
      <Closing />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Expertise                                                          */
/* ------------------------------------------------------------------ */

function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`);
  window.dispatchEvent(new CustomEvent('oz:scrollto', { detail: target }));
  const heading = target.querySelector<HTMLElement>('h2');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}

export function ExpertisePage() {
  const [current, setCurrent] = useState<string>(services[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent(visible.target.id);
    }, { rootMargin: '-35% 0px -55% 0px' });
    services.forEach((service) => { const el = document.getElementById(service.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <PageHero label="Expertise Odoo" title={<>Intégrer Odoo,<br /><span>c’est d’abord relier.</span></>} text="Un logiciel ne change pas une organisation à lui seul. Nos interventions couvrent ce qui fait réussir un projet Odoo : comprendre, configurer, reprendre l’existant, connecter et transmettre.">
        <Action>Parlons de votre projet</Action>
        <TextLink to="/accompagnement">Voir les étapes d’un projet</TextLink>
      </PageHero>

      <div className="expertise-layout">
        <nav className="expertise-nav" aria-label="Savoir-faire">
          <ol>
            {services.map((service, index) => (
              <li key={service.id}><a href={`#${service.id}`} aria-current={current === service.id ? 'true' : undefined} onClick={(event) => { event.preventDefault(); scrollToId(service.id); }}><span>{pad(index + 1)}</span>{service.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="expertise-articles">
          {services.map((service, index) => (
            <article id={service.id} key={service.id} className={`expertise-article layout-${index % 3}`}>
              <div className="article-head" data-reveal>
                <span className="article-number" aria-hidden="true">{pad(index + 1)}</span>
                <h2>{service.title}</h2>
                <p className="article-lead">{service.lead}</p>
              </div>
              <Figure src={service.image} alt={service.alt} ratio={index % 3 === 1 ? '16 / 8' : index % 3 === 2 ? '4 / 3' : '16 / 10'} position={service.id === 'formation' ? '62% 58%' : 'center 45%'} />
              <div className="article-body" data-reveal>
                <p>{service.text}</p>
                <ul className="tick-list">{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="apps-overview" aria-labelledby="apps-title">
        <div className="apps-head" data-reveal>
          <h2 id="apps-title">Ce qu’Odoo peut réunir.</h2>
          <p>Quelques applications que l’on retrouve souvent dans les projets d’entreprise. Le bon périmètre dépend de votre activité, de l’édition d’Odoo retenue et de vos priorités.</p>
        </div>
        <div className="apps-columns">
          {lanes.map((lane) => (
            <div key={lane.id} className="apps-column" data-reveal>
              <h3>{lane.label}</h3>
              <dl>
                {apps.filter((app) => app.lane === lane.id).map((app) => <div key={app.id}><dt>{app.name}</dt><dd>{app.role}</dd></div>)}
              </dl>
            </div>
          ))}
        </div>
        <Action to="/vos-enjeux#selecteur" variant="outline">Composer votre périmètre</Action>
      </section>

      <Closing title={<>Un besoin précis,<br />ou seulement une intuition ?</>} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Journey                                                            */
/* ------------------------------------------------------------------ */

export function JourneyPage() {
  const [params] = useSearchParams();
  const fromParam = phases.findIndex((phase) => phase.id === params.get('etape'));
  const [active, setActive] = useState(Math.max(0, fromParam));
  useEffect(() => { if (fromParam >= 0) setActive(fromParam); }, [fromParam]);
  const phase = phases[active];
  const id = useId();
  return (
    <>
      <PageHero label="Notre accompagnement" title={<>Un projet Odoo<br /><span>se mène ensemble.</span></>} text="Cinq étapes, du premier échange aux évolutions. Elles se recoupent parfois, mais chacune a un but précis et des décisions qui vous reviennent.">
        <Action>Commencer par un échange</Action>
      </PageHero>

      <section className="journey" id="etapes" aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`} className="sr-only">Les étapes du projet</h2>
        <div className="journey-tabs" role="tablist" aria-label="Étapes de l’accompagnement" onKeyDown={onTabKey}>
          {phases.map((item, index) => (
            <button key={item.id} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} className={index < active ? 'is-past' : ''}>
              <span>{pad(index + 1)}</span>{item.label}
            </button>
          ))}
          <span className="journey-progress" aria-hidden="true" style={{ '--progress': (active + 1) / phases.length } as CSSProperties} />
        </div>
        <div className="journey-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
          <span className="journey-number" aria-hidden="true" key={`n-${phase.id}`} data-number={pad(active + 1)} />
          <div className="journey-main" key={`m-${phase.id}`}>
            <h3>{phase.title}</h3>
            <p>{phase.text}</p>
          </div>
          <div className="journey-columns" key={`c-${phase.id}`}>
            <div><h4>Ensemble</h4><ul className="tick-list">{phase.together.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h4>De votre côté</h4><ul className="tick-list">{phase.you.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="journey-result"><h4>Ce qui en ressort</h4><p>{phase.result}</p></div>
          </div>
          <div className="journey-nav">
            <button type="button" className="text-button" disabled={active === 0} onClick={() => setActive(active - 1)}>Étape précédente</button>
            <button type="button" className="text-button" disabled={active === phases.length - 1} onClick={() => setActive(active + 1)}>Étape suivante</button>
          </div>
        </div>
      </section>

      <section className="principles">
        <Figure src="/images/team-training.webp" alt="Illustration : une collègue explique un écran d’ordinateur à deux personnes assises autour d’une longue table en pierre." ratio="4 / 5" position="62% 55%" className="principles-photo" caption="Visuel d’illustration" />
        <div className="principles-copy">
          <h2 data-reveal>Ce qui guide<br /><span>chaque projet.</span></h2>
          <dl>
            {principles.map((principle) => <div key={principle.title} data-reveal><dt>{principle.title}</dt><dd>{principle.text}</dd></div>)}
          </dl>
        </div>
      </section>

      <Faq items={journeyFaqs} title="Avant de se lancer." />
      <Closing />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Needs and sectors                                                  */
/* ------------------------------------------------------------------ */

export function NeedsPage() {
  const [params] = useSearchParams();
  const { set } = useScope();
  const fromParam = sectors.findIndex((sector) => sector.id === params.get('secteur'));
  const [active, setActive] = useState(Math.max(0, fromParam));
  const [loaded, setLoaded] = useState('');
  useEffect(() => { if (fromParam >= 0) setActive(fromParam); }, [fromParam]);
  const sector = sectors[active];
  const id = useId();
  function load() {
    set(sector.needs);
    setLoaded(sector.title);
    scrollToId('selecteur');
  }
  return (
    <>
      <PageHero label="Vos enjeux" title={<>Partir de votre métier,<br /><span>pas du logiciel.</span></>} text="Ventes, stock, achats, finance, projets, équipes : choisissez ce qui vous freine aujourd’hui. Vous verrez quelles applications Odoo peuvent y répondre et comment elles se relient." />
      <NeedSelector id="selecteur" />
      <p className="sr-only" role="status">{loaded ? `Exemple « ${loaded} » chargé dans le sélecteur.` : ''}</p>

      <section className="sectors" id="secteurs" aria-labelledby={`${id}-title`}>
        <div className="sectors-head" data-reveal>
          <h2 id={`${id}-title`}>Quatre situations<br /><span>que l’on rencontre souvent.</span></h2>
          <p>Des exemples pour amorcer la réflexion, à adapter à votre organisation.</p>
        </div>
        <div className="sector-tabs" role="tablist" aria-label="Exemples par secteur" onKeyDown={onTabKey}>
          {sectors.map((item, index) => (
            <button type="button" key={item.id} role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}>{item.title}</button>
          ))}
        </div>
        <div className="sector-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} key={sector.id}>
          <Figure src={sector.image} alt={sector.alt} ratio="4 / 3" position={sector.id === 'services' ? '62% 58%' : 'center 45%'} />
          <div className="sector-copy">
            <h3>{sector.intro}</h3>
            <p>{sector.text}</p>
            <p className="sector-needs-title">Besoins souvent prioritaires</p>
            <ul className="sector-needs">{sector.needs.map((need) => <li key={need}>{needById[need].label}</li>)}</ul>
            <button type="button" className="button button-primary" onClick={load}><span>Charger cet exemple dans le sélecteur</span><ArrowUpRight size={20} aria-hidden="true" /></button>
          </div>
        </div>
      </section>
      <Closing title={<>Votre situation ne ressemble<br />à aucun exemple ?</>} label="Décrire mon activité" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                              */
/* ------------------------------------------------------------------ */

const values = [
  { title: 'Clarté', text: 'Expliquer chaque choix en termes métier, sans jargon inutile, pour que vous décidiez en connaissance de cause.' },
  { title: 'Écoute', text: 'Partir de la façon dont vos équipes travaillent réellement, avant de proposer une configuration.' },
  { title: 'Mesure', text: 'Avancer par étapes utiles plutôt que de tout transformer d’un coup.' },
  { title: 'Transmission', text: 'Former et documenter pour que l’outil vous appartienne vraiment.' },
];

export function AboutPage() {
  return (
    <>
      <PageHero label="À propos" title={<>Une société dédiée à Odoo.<br /><span>Au sein du groupe Ozania.</span></>} text="ozania.io accompagne les entreprises qui veulent organiser leur activité autour d’Odoo. Nous faisons partie du même groupe qu’Ozania, avec un rôle précis : l’intégration d’Odoo.">
        <Action>Faisons connaissance</Action>
      </PageHero>

      <section className="about-story">
        <Figure src="/images/team-low-angle.webp" alt="Illustration : quatre collègues penchés sur une tablette autour d’une table ronde, près d’une haute fenêtre en arche." ratio="4 / 5" position="center 40%" caption="Visuel d’illustration. Ne représente pas l’équipe d’ozania.io." />
        <div className="about-copy" data-reveal>
          <h2>Pourquoi une société<br /><span>consacrée à Odoo ?</span></h2>
          <p>Un projet Odoo touche à la façon dont une entreprise vend, achète, produit, facture et s’organise. Il demande du temps, de l’écoute et une connaissance fine des processus.</p>
          <p>Concentrer une équipe sur ce seul sujet permet de lui consacrer l’attention qu’il mérite. Notre point de départ reste votre quotidien : l’outil vient ensuite, au service de vos équipes.</p>
        </div>
      </section>

      <section className="values" aria-labelledby="values-title">
        <h2 id="values-title" data-reveal>Notre façon<br /><span>de travailler.</span></h2>
        <dl>
          {values.map((value) => <div key={value.title} data-reveal><dt>{value.title}</dt><dd>{value.text}</dd></div>)}
        </dl>
      </section>

      <section className="group-statement group-statement-about">
        <p className="statement" data-reveal>Ozania et ozania.io appartiennent au même groupe. <span>ozania.io se consacre à l’intégration d’Odoo pour les entreprises.</span></p>
        <TextLink to="/expertise-odoo">Voir notre expertise</TextLink>
      </section>

      <Closing title={<>La prochaine étape ?<br />Faisons connaissance.</>} label="Prendre contact" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy and 404                                                    */
/* ------------------------------------------------------------------ */

export function PrivacyPage() {
  const sections: [string, string[]][] = [
    ['Ce que fait le formulaire', ['Le formulaire de contact vous aide à préparer une demande. Dans la version actuelle du site, il ne transmet rien : il met en forme votre message, que vous pouvez ensuite copier ou télécharger pour l’envoyer vous-même.', 'Si un envoi direct est activé plus tard, cette page sera mise à jour avant l’activation, avec le destinataire et le prestataire d’envoi concernés.']],
    ['Les informations saisies', ['Nom, entreprise, adresse e-mail, téléphone facultatif, besoins sélectionnés et message. Elles restent dans la mémoire de votre navigateur le temps de votre visite.', 'Elles ne sont enregistrées ni dans le stockage local du navigateur, ni dans un cookie, ni sur un serveur du site.']],
    ['Cookies et mesure d’audience', ['Le site ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience ou de publicité.']],
    ['Ressources externes', ['Les polices de caractères et les images sont servies par le site lui-même. Aucune ressource n’est chargée depuis un service tiers pendant la navigation.']],
    ['Hébergement', ['Comme tout site web, l’hébergeur peut conserver des journaux techniques (adresse IP, date, page demandée) pour assurer la sécurité et le bon fonctionnement du service. Le nom de l’hébergeur sera précisé lors de la mise en ligne publique.']],
    ['Vos droits', ['Conformément à la réglementation applicable en matière de protection des données, vous pourrez demander l’accès, la rectification ou la suppression des informations que vous nous aurez transmises. Les coordonnées du responsable de traitement et le moyen de nous joindre seront indiqués ici dès leur confirmation.']],
  ];
  return (
    <>
      <PageHero label="Confidentialité" title={<>Vos informations,<br /><span>simplement expliquées.</span></>} text="Ce que devient ce que vous saisissez sur ozania.io, sans détour." />
      <div className="prose-page">
        <p className="prose-note">Version de prévisualisation. Les mentions légales et les coordonnées du responsable de traitement seront complétées avant la publication.</p>
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
        <h1>Cette page ne fait pas<br /><span>partie du périmètre.</span></h1>
        <p className="lede">Elle a peut-être été déplacée, ou l’adresse contient une erreur. Voici de quoi reprendre le fil.</p>
        <ul className="not-found-links">
          {[['Accueil', '/'], ['Vos enjeux', '/vos-enjeux'], ['Expertise Odoo', '/expertise-odoo'], ['Préparer une demande', '/contact']].map(([label, to]) => <li key={to}><Link to={to}><span>{label}</span><ArrowUpRight size={20} aria-hidden="true" /></Link></li>)}
        </ul>
        <button type="button" className="button button-outline" onClick={() => window.dispatchEvent(new Event('oz:search'))}><span>Rechercher sur le site</span><MagnifyingGlass size={20} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
