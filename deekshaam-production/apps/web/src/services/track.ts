/**
 * First-party, cookie-free analytics client.
 *
 * - Anonymous random ids only (visitor in localStorage, session in sessionStorage): no names,
 *   emails or phone numbers ever go in an event.
 * - Honors the browser's Do Not Track setting.
 * - Attaches where the session came from (referrer or utm_* tags), captured once at landing.
 */
const KEY_VISITOR = 'dbs_vid';
const KEY_SESSION = 'dbs_sid';
const KEY_LANDING = 'dbs_landing';

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function remember(store: Storage, key: string, make: () => string): string {
  try {
    let v = store.getItem(key);
    if (!v) { v = make(); store.setItem(key, v); }
    return v;
  } catch {
    return make(); // storage blocked: still counts, just as a one-off session
  }
}

function landing(): { referrer: string; utm: { source?: string; medium?: string; campaign?: string } } {
  return JSON.parse(remember(sessionStorage, KEY_LANDING, () => {
    const q = new URLSearchParams(window.location.search);
    let referrer = document.referrer;
    try { if (new URL(referrer).host === window.location.host) referrer = ''; } catch { referrer = ''; }
    const utm = { source: q.get('utm_source') || undefined, medium: q.get('utm_medium') || undefined, campaign: q.get('utm_campaign') || undefined };
    return JSON.stringify({ referrer, utm });
  }));
}

const device = () => (window.innerWidth < 768 ? 'phone' : window.innerWidth < 1100 ? 'tablet' : 'desktop');

let lastKey = '';
let lastAt = 0;

export interface TrackInput {
  eventType: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

/** Sends one event. Resolves quietly: analytics must never break the page. */
export function sendEvent(input: TrackInput): Promise<void> {
  if (navigator.doNotTrack === '1') return Promise.resolve();
  const pagePath = input.pagePath || window.location.pathname;
  const key = `${input.eventType}|${pagePath}|${JSON.stringify(input.metadata || {})}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 1000) return Promise.resolve(); // dev double-effects, double clicks
  lastKey = key;
  lastAt = now;
  const l = landing();
  return fetch('/api/analytics/event', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: input.eventType,
      pagePath,
      referrer: l.referrer || undefined,
      utm: l.utm,
      visitorId: remember(localStorage, KEY_VISITOR, uuid),
      sessionId: remember(sessionStorage, KEY_SESSION, uuid),
      device: device(),
      metadata: input.metadata,
    }),
  }).then(() => undefined, () => undefined);
}

export const track = (eventType: string, metadata?: Record<string, unknown>) => sendEvent({ eventType, metadata });
