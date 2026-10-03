/**
 * Content-change tracker: gives every public URL a truthful lastmod and pushes changed
 * URLs to IndexNow (Bing, Copilot, Yandex, Naver, Seznam) the moment the CMS saves.
 *
 * It fingerprints each page's rendered output, so any CMS module (programs, news, events,
 * videos, site settings, future ones) is covered without per-controller hooks, and only
 * URLs whose visible content actually changed get a new lastmod or a ping.
 */
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { indexablePaths, resolvePage, abs } from './render';

// ponytail: in-process state, resets on restart (lastmod then falls back to publish dates).
// Persist to the database if the API ever runs as multiple instances.
const fingerprints = new Map<string, string>();
const modifiedAt = new Map<string, string>();
let baselined = false;

function fingerprint(path: string) {
  const p = resolvePage(path);
  return crypto.createHash('sha1').update(`${p.status}|${p.title}|${p.description}|${p.body}`).digest('hex');
}

function ensureBaseline() {
  if (baselined) return;
  for (const p of indexablePaths()) fingerprints.set(p, fingerprint(p));
  baselined = true;
}

export function lastModified(path: string): string | undefined {
  return modifiedAt.get(path);
}

/** Re-fingerprints all known + current URLs; returns the ones that changed (incl. removed ones). */
export function detectChanges(now = new Date().toISOString()): string[] {
  ensureBaseline();
  const changed: string[] = [];
  for (const p of new Set([...fingerprints.keys(), ...indexablePaths()])) {
    const next = fingerprint(p);
    if (fingerprints.get(p) !== next) {
      fingerprints.set(p, next);
      modifiedAt.set(p, now);
      changed.push(p);
    }
  }
  return changed;
}

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY?.trim() || '';

async function submitIndexNow(paths: string[]) {
  if (!INDEXNOW_KEY || !config.isProduction || !paths.length) return;
  const origin = new URL(config.clientOrigin);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: origin.host, key: INDEXNOW_KEY, keyLocation: abs(`/${INDEXNOW_KEY}.txt`), urlList: paths.map(abs).slice(0, 10000) }),
    });
    if (res.status >= 300) console.warn(`[IndexNow] ${res.status} for ${paths.length} URL(s)`);
  } catch (e: any) {
    console.warn(`[IndexNow] submission failed: ${e.message}`);
  }
}

/** Mount before CMS routes: after any successful write, diff pages and notify search engines. */
export function trackContentChanges(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  ensureBaseline();
  res.on('finish', () => {
    if (res.statusCode < 400) void submitIndexNow(detectChanges());
  });
  next();
}
