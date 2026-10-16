// Fonction serverless (style Vercel, API web standard Request/Response).
// Envoi via Resend (fetch uniquement), seulement si RESEND_API_KEY, CONTACT_FROM_EMAIL
// et CONTACT_TO_EMAIL sont tous définis. Aucun destinataire par défaut.
// Le visiteur ne choisit jamais le destinataire ni l'expéditeur : son e-mail sert uniquement de reply_to.

const NEEDS: Record<string, string> = {
  prospects: 'Suivre les prospects', devis: 'Faire des devis', enligne: 'Vendre en ligne', caisse: 'Encaisser en boutique',
  sav: 'Suivre le service après-vente', stock: 'Connaître le stock réel', achats: 'Gérer les achats', production: 'Piloter la production',
  projets: 'Suivre les projets', facturation: 'Facturer', compta: 'Suivre la comptabilité', equipes: 'Coordonner les équipes',
};
const MAX_BODY = 20_000;

function reply(status: number, body: Record<string, unknown>, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

// Retire les caractères de contrôle (hors retours à la ligne pour le message), tronque.
function clean(value: unknown, max: number, multiline = false): string {
  if (typeof value !== 'string') return '';
  const pattern = multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, ' ').trim().slice(0, max);
}

export async function POST(request: Request): Promise<Response> {
  if (request.method !== 'POST') return reply(405, { delivered: false, reason: 'method-not-allowed' }, { Allow: 'POST' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) return reply(503, { delivered: false, reason: 'not-configured' });

  let raw: string;
  try { raw = await request.text(); } catch { return reply(400, { delivered: false, reason: 'invalid-request' }); }
  if (raw.length > MAX_BODY) return reply(413, { delivered: false, reason: 'too-large' });

  let data: unknown;
  try { data = JSON.parse(raw); } catch { return reply(400, { delivered: false, reason: 'invalid-request' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { delivered: false, reason: 'invalid-request' });
  const body = data as Record<string, unknown>;

  // Anti-spam : champ piège rempli, réponse silencieuse sans envoi.
  if (clean(body.website, 200)) return reply(200, { delivered: false });

  const name = clean(body.name, 100);
  const company = clean(body.company, 150);
  const role = clean(body.role, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 4000, true);
  const status = clean(body.status, 100);
  const size = clean(body.size, 100);
  const horizon = clean(body.horizon, 100);
  const needs = Array.isArray(body.needs)
    ? [...new Set(body.needs.filter((id): id is string => typeof id === 'string' && Object.hasOwn(NEEDS, id)))].slice(0, 12)
    : [];

  const valid = name.length >= 2 && company.length >= 1 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email)
    && message.length >= 10 && body.consent === true;
  if (!valid) return reply(400, { delivered: false, reason: 'invalid-fields' });

  const text = [
    'Nouvelle demande via ozania.io', '',
    `Nom : ${name}`, `Entreprise : ${company}`, `Fonction : ${role || 'Non renseignée'}`,
    `E-mail : ${email}`, `Téléphone : ${phone || 'Non renseigné'}`, '',
    `Situation : ${status || 'Non renseignée'}`, `Taille : ${size || 'Non renseignée'}`, `Horizon : ${horizon || 'Non renseigné'}`,
    `Besoins : ${needs.length ? needs.map((id) => NEEDS[id]).join(', ') : 'Non renseignés'}`, '',
    message, '', 'Consentement à être recontacté : oui.',
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject: 'Nouvelle demande via ozania.io', text }),
      signal: AbortSignal.timeout(12_000),
    });
    // Succès uniquement si le fournisseur répond 2xx.
    if (response.status < 200 || response.status > 299) return reply(502, { delivered: false, reason: 'provider-error' });
    return reply(200, { delivered: true });
  } catch {
    return reply(502, { delivered: false, reason: 'provider-unreachable' });
  }
}
