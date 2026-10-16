import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Copy, DownloadSimple, EnvelopeSimple, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { company, isNeedId, needById, needGroups, needs, scopeFor, type NeedId } from './data';
import { useScope } from './Selector';

const odooStatus = [
  { id: 'non', label: 'Pas encore' },
  { id: 'oui', label: 'Oui, et nous voulons aller plus loin' },
  { id: 'ancienne', label: 'Oui, dans une version plus ancienne' },
  { id: 'inconnu', label: 'Je ne sais pas' },
];
const teamSizes = ['1 à 10 personnes', '11 à 50 personnes', '51 à 200 personnes', 'Plus de 200 personnes'];
const horizons = ['Dès que possible', 'Dans les prochains mois', 'Dans l’année', 'Pas encore défini'];

type Details = { name: string; company: string; role: string; email: string; phone: string; message: string; consent: boolean; website: string };
type Field = 'name' | 'company' | 'email' | 'phone' | 'message' | 'consent';
const empty: Details = { name: '', company: '', role: '', email: '', phone: '', message: '', consent: false, website: '' };
const fieldLabels: Record<Field, string> = { name: 'Votre nom', company: 'Votre entreprise', email: 'Votre e-mail', phone: 'Téléphone', message: 'Votre message', consent: 'Accord de contact' };

function validate(details: Details) {
  const errors: Partial<Record<Field, string>> = {};
  if (details.name.trim().length < 2) errors.name = 'Indiquez votre nom.';
  if (details.company.trim().length < 2) errors.company = 'Indiquez le nom de votre entreprise.';
  if (!details.email.trim()) errors.email = 'Indiquez votre adresse e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) errors.email = 'Cette adresse e-mail semble incomplète, par exemple nom@entreprise.fr.';
  if (details.phone.trim() && !/^[+\d][\d\s().-]{5,}$/.test(details.phone.trim())) errors.phone = 'Ce numéro contient des caractères inattendus.';
  if (details.message.trim().length < 20) errors.message = 'Décrivez votre situation en quelques phrases (20 caractères minimum).';
  if (!details.consent) errors.consent = 'Cochez cette case pour que nous puissions vous répondre.';
  return errors;
}

export default function ContactPage() {
  const [params] = useSearchParams();
  const scope = useScope();
  const initialNeeds = useMemo(() => {
    const fromUrl = (params.get('besoins') || '').split(',').filter(isNeedId);
    return fromUrl.length ? fromUrl : scope.selected;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState<NeedId[]>(initialNeeds);
  const [open, setOpen] = useState(initialNeeds.length === 0);
  const [status, setStatus] = useState('');
  const [size, setSize] = useState('');
  const [horizon, setHorizon] = useState('');
  const [details, setDetails] = useState<Details>(empty);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [result, setResult] = useState<'draft' | 'sent' | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const apiDelivery = import.meta.env.VITE_CONTACT_DELIVERY === 'api';

  const mounted = useRef(false);
  useEffect(() => { scope.set(selected); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const focusHeading = () => window.setTimeout(() => { const card = heading.current?.closest('.contact-card'); heading.current?.focus({ preventScroll: true }); if (card && card.getBoundingClientRect().top < 0) window.dispatchEvent(new CustomEvent('oz:scrollto', { detail: card })); }, 30);
  // Move focus to the new step heading, but never on first load (the route focuses the h1).
  useEffect(() => { if (mounted.current && !result) focusHeading(); mounted.current = true; }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopeApps = scopeFor(selected).apps;
  const toDefine = open && selected.length === 0;
  const statusLabel = odooStatus.find((x) => x.id === status)?.label;
  const subject = `Projet Odoo : ${details.company.trim() || 'demande'}${selected.length ? ` · ${selected.length} besoin${selected.length > 1 ? 's' : ''}` : ''}`;
  const message = [
    'Bonjour,', '', 'Je souhaite échanger sur un projet Odoo.', '',
    `Nom : ${details.name.trim()}`,
    `Entreprise : ${details.company.trim()}`,
    details.role.trim() ? `Fonction : ${details.role.trim()}` : '',
    `E-mail : ${details.email.trim()}`,
    `Téléphone : ${details.phone.trim() || 'non renseigné'}`, '',
    `Besoins : ${selected.length ? selected.map((id) => needById[id].label).join(' ; ') : 'à définir ensemble'}`,
    scopeApps.length ? `Applications Odoo envisagées : ${scopeApps.map((app) => app.name).join(', ')}` : '',
    `Utilise déjà Odoo : ${statusLabel || 'non précisé'}`,
    `Taille de l’équipe : ${size || 'non précisée'}`,
    `Horizon souhaité : ${horizon || 'non précisé'}`, '',
    details.message.trim(), '',
    'J’accepte d’être recontacté(e) au sujet de cette demande.',
  ].filter((line, index, list) => line !== '' || list[index - 1] !== '').join('\n');

  function update(name: keyof Details, value: string | boolean) {
    setDetails((current) => ({ ...current, [name]: value }));
    if (errors[name as Field]) setErrors((current) => ({ ...current, [name]: undefined }));
  }
  function toggle(id: NeedId) { setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])); setStepError(''); }

  function nextFromScope(event: FormEvent) {
    event.preventDefault();
    if (!selected.length && !open) { setStepError('Choisissez au moins un besoin, ou indiquez que le périmètre reste à définir.'); window.setTimeout(() => document.getElementById('step-error')?.focus(), 0); return; }
    setStepError('');
    setStep(2);
  }
  function nextFromDetails(event: FormEvent) {
    event.preventDefault();
    const found = validate(details);
    setErrors(found);
    if (Object.keys(found).length) { window.setTimeout(() => summary.current?.focus(), 0); return; }
    setStep(3);
  }
  async function submit() {
    setNotice('');
    if (details.website) return; // honeypot
    if (!apiDelivery) { setResult('draft'); focusHeading(); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, needs: selected, status, size, horizon }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.delivered !== true) throw new Error('not delivered');
      setResult('sent');
    } catch {
      setNotice('L’envoi direct n’a pas abouti. Rien n’a été transmis : votre demande est prête à être copiée ou téléchargée.');
      setResult('draft');
    } finally { setLoading(false); focusHeading(); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${subject}\n\n${message}`); setCopied(true); window.setTimeout(() => setCopied(false), 4000); }
    catch { setNotice('La copie n’est pas disponible dans ce navigateur. Utilisez le téléchargement ou sélectionnez le texte ci-dessous.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([`${subject}\n\n${message}\n`], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'demande-projet-odoo-ozania-io.txt';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const fieldProps = (name: Field) => ({ 'aria-invalid': errors[name] ? true : undefined, 'aria-describedby': errors[name] ? `${name}-error` : undefined, id: `field-${name}` });
  const FieldError = ({ name }: { name: Field }) => (errors[name] ? <span className="field-error" id={`${name}-error`}><WarningCircle size={16} aria-hidden="true" />{errors[name]}</span> : null);
  const steps = ['Votre projet', 'Vos coordonnées', 'Relecture'];

  return (
    <div className="contact-page">
      <section className="contact-intro">
        <p className="eyebrow">Contact</p>
        <h1>Votre projet Odoo.<br /><span>Parlons-en.</span></h1>
        <p className="lede">Quelques informations suffisent pour préparer un premier échange utile. Vous relirez votre demande avant de la transmettre.</p>
        <div className="delivery-note">
          <strong>Ce formulaire ne transmet rien pour le moment.</strong>
          <p>{apiDelivery ? 'L’envoi direct est activé : la confirmation n’apparaît que si le serveur la renvoie.' : 'L’adresse de réception d’ozania.io est en cours de confirmation. À la fin, vous pourrez copier ou télécharger votre message pour l’envoyer vous-même.'}</p>
          <Link to="/confidentialite" className="inline-link">Ce que deviennent vos informations</Link>
        </div>
      </section>

      <section className="contact-card" aria-label="Formulaire de demande">
        {result ? (
          <div className="contact-result">
            <span className="result-icon" aria-hidden="true">{result === 'sent' ? <Check size={26} /> : <EnvelopeSimple size={26} />}</span>
            <h2 ref={heading} tabIndex={-1}>{result === 'sent' ? 'Votre demande a bien été envoyée.' : 'Votre demande est prête. Elle n’a pas encore été envoyée.'}</h2>
            {notice && <p className="form-alert" role="alert">{notice}</p>}
            {result === 'draft' && <>
              <p>{company.email ? `Copiez ou téléchargez le message, ou ouvrez-le dans votre messagerie pour l’adresser à ${company.email}.` : 'Copiez ou téléchargez le message ci-dessous. Vous pourrez l’envoyer dès que l’adresse de contact d’ozania.io sera communiquée.'}</p>
              <div className="result-actions">
                <button type="button" className="button button-primary" onClick={copy}><span>{copied ? 'Message copié' : 'Copier le message'}</span>{copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}</button>
                <button type="button" className="button button-outline" onClick={download}><span>Télécharger (.txt)</span><DownloadSimple size={20} aria-hidden="true" /></button>
                {company.email && <a className="button button-outline" href={`mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}><span>Ouvrir dans ma messagerie</span><ArrowUpRight size={20} aria-hidden="true" /></a>}
              </div>
              <p className="sr-only" role="status" aria-live="polite">{copied ? 'Le message a été copié dans le presse-papiers.' : ''}</p>
              <label className="field result-preview">Aperçu du message<textarea readOnly value={`${subject}\n\n${message}`} rows={12} /></label>
            </>}
            <button type="button" className="back-button" onClick={() => { setResult(null); setStep(3); setNotice(''); }}><ArrowLeft size={17} aria-hidden="true" />Modifier ma demande</button>
          </div>
        ) : (
          <>
            <ol className="form-progress" aria-label="Étapes du formulaire">
              {steps.map((label, index) => (
                <li key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} aria-current={step === index + 1 ? 'step' : undefined}>
                  <span className="progress-index">{step > index + 1 ? <Check size={12} weight="bold" aria-hidden="true" /> : `0${index + 1}`}</span><span className="progress-label">{label}</span>
                  {step > index + 1 && <span className="sr-only"> (terminée)</span>}
                </li>
              ))}
            </ol>

            {step === 1 && (
              <form onSubmit={nextFromScope} noValidate>
                <h2 ref={heading} tabIndex={-1}>De quoi avez-vous besoin ?</h2>
                <p className="form-intro">{initialNeeds.length ? 'Votre sélection a été reprise. Vous pouvez l’ajuster.' : 'Choisissez un ou plusieurs besoins. Rien n’est figé : nous préciserons ensemble.'}</p>
                <fieldset className="contact-needs" aria-describedby={stepError ? 'step-error' : undefined}>
                  <legend className="sr-only">Vos besoins</legend>
                  {needGroups.map((group) => (
                    <div key={group.id} className="contact-need-group">
                      <p>{group.label}</p>
                      <div>
                        {needs.filter((need) => need.group === group.id).map((need) => (
                          <label key={need.id} className={`chip ${selected.includes(need.id) ? 'on' : ''}`}>
                            <input type="checkbox" checked={selected.includes(need.id)} onChange={() => toggle(need.id)} />
                            <span className="chip-check" aria-hidden="true">{selected.includes(need.id) && <Check size={11} weight="bold" />}</span>{need.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <label className={`chip chip-wide ${open ? 'on' : ''}`}>
                    <input type="checkbox" checked={open} onChange={(event) => { setOpen(event.target.checked); setStepError(''); }} />
                    <span className="chip-check" aria-hidden="true">{open && <Check size={11} weight="bold" />}</span>Le périmètre reste à définir ensemble
                  </label>
                </fieldset>
                {scopeApps.length > 0 && <p className="scope-preview"><span>Applications envisagées</span>{scopeApps.map((app) => app.name).join(' · ')}</p>}

                <fieldset className="radio-group">
                  <legend>Utilisez-vous déjà Odoo ? <small>(facultatif)</small></legend>
                  <div>{odooStatus.map((option) => <label key={option.id} className={`radio ${status === option.id ? 'on' : ''}`}><input type="radio" name="odoo" value={option.id} checked={status === option.id} onChange={() => setStatus(option.id)} />{option.label}</label>)}</div>
                </fieldset>
                <div className="form-two-columns">
                  <label className="field">Taille de l’équipe <small>(facultatif)</small>
                    <select value={size} onChange={(event) => setSize(event.target.value)}><option value="">Non précisée</option>{teamSizes.map((value) => <option key={value}>{value}</option>)}</select>
                  </label>
                  <label className="field">Horizon souhaité <small>(facultatif)</small>
                    <select value={horizon} onChange={(event) => setHorizon(event.target.value)}><option value="">Non précisé</option>{horizons.map((value) => <option key={value}>{value}</option>)}</select>
                  </label>
                </div>
                {stepError && <p className="form-alert" id="step-error" role="alert" tabIndex={-1}><WarningCircle size={18} aria-hidden="true" />{stepError}</p>}
                <div className="form-footer"><button type="submit" className="button button-primary"><span>Continuer</span><ArrowUpRight size={20} aria-hidden="true" /></button></div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={nextFromDetails} noValidate>
                <button type="button" className="back-button" onClick={() => setStep(1)}><ArrowLeft size={17} aria-hidden="true" />Revoir mon projet</button>
                <h2 ref={heading} tabIndex={-1}>Faisons connaissance.</h2>
                <p className="form-intro">Les champs marqués d’un astérisque sont obligatoires.</p>
                {Object.values(errors).some(Boolean) && (
                  <div className="error-summary" ref={summary} tabIndex={-1} role="alert" aria-labelledby="error-summary-title">
                    <p id="error-summary-title"><WarningCircle size={18} aria-hidden="true" />{Object.values(errors).filter(Boolean).length > 1 ? `${Object.values(errors).filter(Boolean).length} points à compléter` : 'Un point à compléter'}</p>
                    <ul>{(Object.keys(errors) as Field[]).filter((key) => errors[key]).map((key) => <li key={key}><a href={`#field-${key}`} onClick={(event) => { event.preventDefault(); document.getElementById(`field-${key}`)?.focus(); }}>{fieldLabels[key]} : {errors[key]}</a></li>)}</ul>
                  </div>
                )}
                <div className="form-two-columns">
                  <label className="field">Votre nom *<input {...fieldProps('name')} autoComplete="name" value={details.name} onChange={(e) => update('name', e.target.value)} maxLength={100} required /><FieldError name="name" /></label>
                  <label className="field">Votre entreprise *<input {...fieldProps('company')} autoComplete="organization" value={details.company} onChange={(e) => update('company', e.target.value)} maxLength={150} required /><FieldError name="company" /></label>
                </div>
                <div className="form-two-columns">
                  <label className="field">Votre e-mail *<input {...fieldProps('email')} type="email" inputMode="email" autoComplete="email" value={details.email} onChange={(e) => update('email', e.target.value)} maxLength={200} required /><FieldError name="email" /></label>
                  <label className="field">Téléphone <small>(facultatif)</small><input {...fieldProps('phone')} type="tel" autoComplete="tel" value={details.phone} onChange={(e) => update('phone', e.target.value)} maxLength={40} /><FieldError name="phone" /></label>
                </div>
                <label className="field">Votre fonction <small>(facultatif)</small><input autoComplete="organization-title" value={details.role} onChange={(e) => update('role', e.target.value)} maxLength={100} /></label>
                <label className="field">Parlez-nous de votre situation *
                  <textarea {...fieldProps('message')} value={details.message} onChange={(e) => update('message', e.target.value)} rows={5} maxLength={4000} required placeholder="Votre activité, vos outils actuels, ce que vous aimeriez simplifier…" />
                  <span className="field-hint" aria-hidden="true">{details.message.trim().length} / 20 caractères minimum</span>
                  <FieldError name="message" />
                </label>
                <div className="honeypot" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => update('website', e.target.value)} /></label></div>
                <label className={`consent ${errors.consent ? 'has-error' : ''}`}>
                  <input type="checkbox" {...fieldProps('consent')} checked={details.consent} onChange={(e) => update('consent', e.target.checked)} required />
                  <span>J’accepte d’être recontacté(e) au sujet de cette demande. *<br /><Link to="/confidentialite">Lire la politique de confidentialité</Link></span>
                </label>
                <FieldError name="consent" />
                <div className="form-footer"><button type="submit" className="button button-primary"><span>Relire ma demande</span><ArrowUpRight size={20} aria-hidden="true" /></button></div>
              </form>
            )}

            {step === 3 && (
              <div className="review">
                <h2 ref={heading} tabIndex={-1}>Relisez votre demande.</h2>
                <p className="form-intro">Rien n’est transmis tant que vous n’avez pas validé cette étape.</p>
                <div className="review-block">
                  <div className="review-head"><h3>Votre projet</h3><button type="button" className="text-button" onClick={() => setStep(1)}>Modifier<span className="sr-only"> votre projet</span></button></div>
                  <dl>
                    <div><dt>Besoins</dt><dd>{selected.length ? selected.map((id) => needById[id].label).join(', ') : 'À définir ensemble'}</dd></div>
                    {scopeApps.length > 0 && <div><dt>Applications envisagées</dt><dd>{scopeApps.map((app) => app.name).join(', ')}</dd></div>}
                    <div><dt>Odoo aujourd’hui</dt><dd>{statusLabel || 'Non précisé'}</dd></div>
                    <div><dt>Équipe</dt><dd>{size || 'Non précisée'}</dd></div>
                    <div><dt>Horizon</dt><dd>{horizon || 'Non précisé'}</dd></div>
                  </dl>
                </div>
                <div className="review-block">
                  <div className="review-head"><h3>Vos coordonnées</h3><button type="button" className="text-button" onClick={() => setStep(2)}>Modifier<span className="sr-only"> vos coordonnées</span></button></div>
                  <dl>
                    <div><dt>Nom</dt><dd>{details.name}</dd></div>
                    <div><dt>Entreprise</dt><dd>{details.company}{details.role && ` · ${details.role}`}</dd></div>
                    <div><dt>E-mail</dt><dd>{details.email}</dd></div>
                    <div><dt>Téléphone</dt><dd>{details.phone || 'Non renseigné'}</dd></div>
                    <div className="review-message"><dt>Message</dt><dd>{details.message}</dd></div>
                  </dl>
                </div>
                {toDefine && <p className="small-note">Vous avez indiqué que le périmètre reste à définir : nous commencerons par en parler.</p>}
                <div className="form-footer">
                  <button type="button" className="button button-primary" onClick={submit} disabled={loading} aria-busy={loading}>
                    <span>{loading ? 'Envoi en cours…' : apiDelivery ? 'Envoyer ma demande' : 'Préparer mon message'}</span>
                    {loading ? <SpinnerGap className="spinner" size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
                  </button>
                  <p className="small-note">{apiDelivery ? 'Une confirmation s’affichera uniquement si le serveur accuse réception.' : 'Votre message sera mis en forme pour que vous puissiez le copier ou le télécharger.'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
