/**
 * @deekshaam/top3 - Universal "Always Top 3" results engine.
 *
 * One shared selection engine used by every vertical (jobs, programs,
 * certifications, and any vertical added later). A vertical only supplies
 * a config: how to score listings, which filters exist and in what order
 * they relax, and how to backfill when a scope has no listings.
 */

export type VerticalId = string; // open-ended: 'job' | 'program' | 'certification' | ...

export interface Listing {
  id: string;
  vertical: VerticalId;
  title: string;
  rankScore: number;
  isSponsored?: boolean;
  city?: string;
  tags?: string[];
  url?: string;
  [key: string]: unknown;
}

export interface ActiveFilters {
  [filterKey: string]: string | undefined;
}

export interface TopThreeResult {
  picks: Listing[];
  isBackfilled: boolean;
  /** Which filters had to be relaxed (in order) to reach 3 picks. */
  relaxedFilters: string[];
  /** The vertical the picks came from when backfilled across verticals. */
  backfillVertical?: VerticalId;
}

export interface VerticalConfig {
  vertical: VerticalId;
  /** Ordered filter keys; relaxation drops them last-to-first. */
  filterPriority: string[];
  /** Minimum exact-match count before relaxation kicks in. */
  minExactMatches?: number; // default 3
  /** Cross-vertical fallback order when this vertical is exhausted. */
  backfillOrder?: VerticalId[];
  /** Optional per-listing score boost, applied after base rankScore. */
  scoreBoost?: (listing: Listing) => number;
  /** Sponsored insertion rule: max sponsored picks in the Top 3. */
  maxSponsoredSlots?: number; // default 1
}

export interface TopThreeEngineOptions {
  verticals: Record<VerticalId, VerticalConfig>;
  /** All listings across all verticals, keyed by vertical. */
  listings: Record<VerticalId, Listing[]>;
}

const DEFAULT_MIN_EXACT = 3;
const DEFAULT_MAX_SPONSORED = 1;

function matchesFilters(listing: Listing, filters: ActiveFilters): boolean {
  return Object.keys(filters).every((key) => {
    const value = filters[key];
    if (value === undefined || value === null || value === '') return true;
    const listingValue = listing[key];
    if (listingValue === undefined || listingValue === null) return false;
    if (Array.isArray(listingValue)) {
      return listingValue.some((v) => String(v).toLowerCase() === String(value).toLowerCase());
    }
    return String(listingValue).toLowerCase() === String(value).toLowerCase();
  });
}

function scoreOf(listing: Listing, config: VerticalConfig): number {
  const boost = config.scoreBoost ? config.scoreBoost(listing) : 0;
  return (listing.rankScore ?? 0) + boost;
}

function withSponsoredRule(
  sorted: Listing[],
  maxSponsored: number
): Listing[] {
  // Sponsored listings may occupy at most `maxSponsored` of the top slots.
  // They are interleaved by score but never displace more than that quota.
  const sponsored = sorted.filter((l) => l.isSponsored);
  const organic = sorted.filter((l) => !l.isSponsored);
  if (sponsored.length === 0 || maxSponsored <= 0) return sorted;
  const picks: Listing[] = [];
  let sponsoredUsed = 0;
  let organicIdx = 0;
  let sponsoredIdx = 0;
  while (picks.length < sorted.length) {
    const nextSponsored = sponsored[sponsoredIdx];
    const nextOrganic = organic[organicIdx];
    const sponsoredScore = nextSponsored ? nextSponsored.rankScore ?? 0 : -Infinity;
    const organicScore = nextOrganic ? nextOrganic.rankScore ?? 0 : -Infinity;
    if (nextSponsored && sponsoredUsed < maxSponsored && sponsoredScore >= organicScore) {
      picks.push(nextSponsored);
      sponsoredUsed++;
      sponsoredIdx++;
    } else if (nextOrganic) {
      picks.push(nextOrganic);
      organicIdx++;
    } else if (nextSponsored) {
      picks.push(nextSponsored);
      sponsoredIdx++;
    } else {
      break;
    }
  }
  return picks;
}

export class TopThreeEngine {
  private verticals: Record<VerticalId, VerticalConfig>;
  private listings: Record<VerticalId, Listing[]>;

  constructor(options: TopThreeEngineOptions) {
    this.verticals = options.verticals;
    this.listings = options.listings;
  }

  getTopThree(vertical: VerticalId, activeFilters: ActiveFilters = {}): TopThreeResult {
    const config = this.verticals[vertical];
    if (!config) {
      return { picks: [], isBackfilled: false, relaxedFilters: [] };
    }

    const minExact = config.minExactMatches ?? DEFAULT_MIN_EXACT;
    const maxSponsored = config.maxSponsoredSlots ?? DEFAULT_MAX_SPONSORED;
    const filterPriority = config.filterPriority ?? [];

    // 1. Exact matches on all active filters, sorted by score.
    const exact = this.listings[vertical]
      .filter((l) => matchesFilters(l, activeFilters))
      .sort((a, b) => scoreOf(b, config) - scoreOf(a, config));

    if (exact.length >= minExact) {
      return {
        picks: withSponsoredRule(exact, maxSponsored).slice(0, 3),
        isBackfilled: false,
        relaxedFilters: [],
      };
    }

    // 2. Relax filters one at a time, in reverse priority order.
    const relaxedFilters: string[] = [];
    let pool = exact;
    const dropped: Set<string> = new Set();
    for (let i = filterPriority.length - 1; i >= 0 && pool.length < minExact; i--) {
      const dropKey = filterPriority[i];
      if (activeFilters[dropKey] === undefined) continue;
      relaxedFilters.push(dropKey);
      dropped.add(dropKey);
      const relaxedFiltersMap: ActiveFilters = { ...activeFilters };
      for (const key of dropped) delete relaxedFiltersMap[key];
      pool = this.listings[vertical]
        .filter((l) => matchesFilters(l, relaxedFiltersMap))
        .sort((a, b) => scoreOf(b, config) - scoreOf(a, config));
    }

    if (pool.length >= minExact) {
      return {
        picks: withSponsoredRule(pool, maxSponsored).slice(0, 3),
        isBackfilled: false,
        relaxedFilters,
      };
    }

    // 3. Backfill from the next-broadest scope: other verticals in order.
    const backfillOrder = config.backfillOrder ?? [];
    const picks = [...pool];
    for (const fallbackVertical of backfillOrder) {
      if (picks.length >= minExact) break;
      const fallbackConfig = this.verticals[fallbackVertical];
      if (!fallbackConfig) continue;
      const fallbackListings = this.listings[fallbackVertical] ?? [];
      const fallbackPicks = fallbackListings
        .filter((l) => !picks.some((p) => p.id === l.id))
        .sort((a, b) => scoreOf(b, fallbackConfig) - scoreOf(a, fallbackConfig))
        .slice(0, minExact - picks.length);
      picks.push(...fallbackPicks);
    }

    // 4. Absolute last resort: fewer than 3, with honest copy upstream.
    return {
      picks: picks.slice(0, 3),
      isBackfilled: picks.length > 0 && picks.some((p) => p.vertical !== vertical),
      relaxedFilters,
      backfillVertical: picks.find((p) => p.vertical !== vertical)?.vertical,
    };
  }
}

export function createTopThreeEngine(options: TopThreeEngineOptions): TopThreeEngine {
  return new TopThreeEngine(options);
}
