import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import {
  TopThreeEngine,
  Listing,
  VerticalConfig,
} from '@deekshaam/top3';

/**
 * Vertical registry for the Top 3 engine. Adding a new vertical means
 * adding a config entry here plus listings in the database - the
 * selection, relaxation and backfill logic never changes.
 */
const verticalConfigs: Record<string, VerticalConfig> = {
  job: {
    vertical: 'job',
    // Relaxation order: drop `tag` first, then `city`, `department` last.
    filterPriority: ['city', 'department', 'tag'],
    backfillOrder: ['program', 'certification'],
    maxSponsoredSlots: 1,
  },
  program: {
    vertical: 'program',
    filterPriority: ['city', 'stream', 'specialization'],
    backfillOrder: ['certification', 'job'],
    maxSponsoredSlots: 1,
  },
  certification: {
    vertical: 'certification',
    filterPriority: ['city', 'group', 'duration'],
    backfillOrder: ['program', 'job'],
    maxSponsoredSlots: 1,
  },
};

function toListing(item: any, vertical: string): Listing {
  return {
    id: item.id,
    vertical,
    title: item.title,
    rankScore: item.rankScore ?? 50,
    isSponsored: Boolean(item.isSponsored),
    city: item.city ?? 'Bangalore',
    tags: item.tags ?? item.specializations ?? [],
    url: item.url ?? (vertical === 'program' ? `/programs/${item.slug}` : vertical === 'job' ? `/jobs/${item.slug}` : '/certifications'),
    ...item,
  };
}

let engine: TopThreeEngine | null = null;

function getEngine(): TopThreeEngine {
  if (engine) return engine;
  engine = new TopThreeEngine({
    verticals: verticalConfigs,
    listings: {
      job: memoryDb.jobs.map((j) => toListing(j, 'job')),
      program: memoryDb.programs.map((p) => toListing(p, 'program')),
      certification: memoryDb.certifications.map((c) => toListing(c, 'certification')),
    },
  });
  return engine;
}

/** Rebuild engine listings after CMS mutations. */
export function rebuildTopThreeIndex() {
  engine = null;
}

export function getTopThree(req: Request, res: Response) {
  const vertical = String(req.query.vertical || '').trim();
  if (!vertical) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Missing vertical query parameter' },
    });
  }
  if (!verticalConfigs[vertical]) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Unknown vertical: ${vertical}` },
    });
  }

  const filters: Record<string, string | undefined> = {};
  for (const key of verticalConfigs[vertical].filterPriority) {
    const value = req.query[key];
    if (typeof value === 'string' && value.trim()) filters[key] = value.trim();
  }

  const result = getEngine().getTopThree(vertical, filters);
  res.json({ success: true, data: result });
}

export function getJobs(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.jobs });
}

export function getJobBySlug(req: Request, res: Response) {
  const { slug } = req.params;
  const job = memoryDb.jobs.find((j) => j.slug === slug);
  if (!job) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
  }
  res.json({ success: true, data: job });
}
