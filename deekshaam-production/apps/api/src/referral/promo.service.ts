import crypto from 'crypto';

const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Avoids 0, O, 1, I, L
const RESERVED_WORDS = new Set(['ADMIN', 'SUPER', 'STAFF', 'DEEKSHAAM', 'OFFER', 'FREE', 'TEST', 'NULL', 'ROOT']);

/**
 * Extracts 2 clean alphabetical initials from agent name.
 */
export function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AG';
  if (parts.length === 1) {
    const clean = parts[0].replace(/[^A-Za-z]/g, '').toUpperCase();
    return (clean.slice(0, 2) || 'AG').padEnd(2, 'A');
  }
  const first = parts[0].replace(/[^A-Za-z]/g, '').toUpperCase().charAt(0) || 'A';
  const last = parts[parts.length - 1].replace(/[^A-Za-z]/g, '').toUpperCase().charAt(0) || 'G';
  return `${first}${last}`;
}

/**
 * Generates an uppercase, human-friendly promo code (4 to 8 characters).
 * Pattern: <Initials><DiscountPercent> e.g. PD10
 * If discount is 0: <Initials><2 random digits>
 * Handles collision by appending chars from ALLOWED_CHARS: PD10 -> PD10A -> PD10B ...
 */
export function generatePromoCode(name: string, discountPercent: number, existingCodes: string[]): string {
  const existingSet = new Set(existingCodes.map((c) => c.trim().toUpperCase()));
  const initials = extractInitials(name);
  const discountInt = Math.round(discountPercent);

  let base = discountInt > 0 ? `${initials}${discountInt}` : `${initials}${Math.floor(10 + Math.random() * 89)}`;
  base = base.replace(/[^A-Z0-9]/g, '').toUpperCase();

  if (!existingSet.has(base) && !RESERVED_WORDS.has(base)) {
    return base;
  }

  // Collision handling loop: append characters from allowed charset
  for (let i = 0; i < ALLOWED_CHARS.length; i++) {
    const candidate = `${base}${ALLOWED_CHARS[i]}`;
    if (!existingSet.has(candidate) && !RESERVED_WORDS.has(candidate)) {
      return candidate;
    }
  }

  // Second pass: append two random allowed chars
  for (let attempt = 0; attempt < 50; attempt++) {
    const rand = ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)] + ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)];
    const candidate = `${initials}${rand}${discountInt > 0 ? discountInt : ''}`.slice(0, 8);
    if (!existingSet.has(candidate) && !RESERVED_WORDS.has(candidate)) {
      return candidate;
    }
  }

  // Fallback
  return `${initials}${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 8);
}

/**
 * Sanitizes and normalizes promo code to canonical uppercase.
 */
export function sanitizePromoCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Validates custom promo code override.
 */
export function isValidCustomCode(code: string): { valid: boolean; reason?: string } {
  const sanitized = sanitizePromoCode(code);
  if (sanitized.length < 3 || sanitized.length > 12) {
    return { valid: false, reason: 'Promo code must be between 3 and 12 characters.' };
  }
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return { valid: false, reason: 'Promo code can only contain letters and numbers.' };
  }
  if (RESERVED_WORDS.has(sanitized)) {
    return { valid: false, reason: 'This promo code is reserved and cannot be used.' };
  }
  return { valid: true };
}

/**
 * Math helper: Round half-up to integer minor units (paise).
 */
export function roundHalfUp(amount: number): number {
  return Math.round(amount);
}

export interface CalculationResult {
  grossFeePaise: number;
  discountPercent: number;
  discountAmountPaise: number;
  netFeePaise: number;
  commissionBasePaise: number;
  commissionPercent: number;
  commissionAmountPaise: number;
}

/**
 * Computes exact financial breakdown in paise (1 INR = 100 paise).
 * Never uses floating-point arithmetic for final money.
 */
export function calculateReferralAmounts(params: {
  grossFeePaise: number;
  discountPercent: number;
  commissionPercent: number;
  commissionBase?: 'NET_FEE' | 'GROSS_FEE';
}): CalculationResult {
  const { grossFeePaise, discountPercent, commissionPercent, commissionBase = 'NET_FEE' } = params;

  // Student discount: round_half_up(gross * discountPercent / 100)
  const discountAmountPaise = roundHalfUp((grossFeePaise * discountPercent) / 100);
  const netFeePaise = Math.max(0, grossFeePaise - discountAmountPaise);

  // Commission base: NET_FEE (default) or GROSS_FEE
  const commissionBasePaise = commissionBase === 'GROSS_FEE' ? grossFeePaise : netFeePaise;
  const commissionAmountPaise = roundHalfUp((commissionBasePaise * commissionPercent) / 100);

  return {
    grossFeePaise,
    discountPercent,
    discountAmountPaise,
    netFeePaise,
    commissionBasePaise,
    commissionPercent,
    commissionAmountPaise,
  };
}
