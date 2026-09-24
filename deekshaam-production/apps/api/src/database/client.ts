import { PrismaClient } from '@prisma/client';
import {
  institutionSeed,
  programsSeed,
  certificationsSeed,
  leadersSeed,
  employersSeed,
  newsSeed,
  eventsSeed,
  noticesSeed,
  gallerySeed,
  defaultRoles,
  defaultPermissions,
} from './seed-data';
import { jobsSeed } from './jobs-seed';
import bcrypt from 'bcryptjs';
import { requiredPassword } from '../config';

// Prisma client instance
export const prisma = new PrismaClient();

// In-memory fallback repository for standalone testing and instant zero-dependency execution
class MemoryDatabase {
  public siteSettings: any = { ...institutionSeed, id: 'settings-1' };
  public programs: any[] = [...programsSeed.map((p, idx) => ({ ...p, id: `prog-${idx + 1}` }))];
  public certifications: any[] = [...certificationsSeed.map((c, idx) => ({ ...c, id: `cert-${idx + 1}` }))];
  public jobs: any[] = [...jobsSeed.map((j, idx) => ({ ...j, id: `job-${idx + 1}` }))];
  public faculty: any[] = [...leadersSeed.map((l, idx) => ({ ...l, id: `fac-${idx + 1}` }))];
  public news: any[] = [...newsSeed.map((n, idx) => ({ ...n, id: `news-${idx + 1}` }))];
  public events: any[] = [...eventsSeed.map((e, idx) => ({ ...e, id: `evt-${idx + 1}` }))];
  public notices: any[] = [...noticesSeed.map((n, idx) => ({ ...n, id: `not-${idx + 1}` }))];
  public gallery: any[] = [...gallerySeed.map((g, idx) => ({ ...g, id: `gal-${idx + 1}` }))];
  public stories: any[] = [];
  public employers: any[] = [...employersSeed];
  public media: any[] = [];
  public videos: any[] = [];
  public users: any[] = [
    {
      id: 'usr-admin-1',
      email: 'admin@deekshaam.edu',
      passwordHash: bcrypt.hashSync(requiredPassword('ADMIN_PASSWORD', 'super admin'), 10),
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-admissions-1',
      email: 'admissions@deekshaam.edu',
      passwordHash: bcrypt.hashSync(requiredPassword('STAFF_PASSWORD', 'admissions staff'), 10),
      name: 'Admissions Officer',
      role: 'ADMISSION_STAFF',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  public applications: any[] = [];
  public applicationDocuments: any[] = [];
  public applicationStatusHistory: any[] = [];
  public leads: any[] = [];
  public leadHistory: any[] = [];
  public payments: any[] = [];
  public auditLogs: any[] = [];
  public searchIndex: any[] = [];
  public analyticsEvents: any[] = [];

  constructor() {
    this.buildSearchIndex();
  }

  public buildSearchIndex() {
    this.searchIndex = [
      ...this.programs.map((p) => ({
        id: `idx-${p.id}`,
        title: `${p.code} - ${p.title}`,
        content: `${p.summary} ${p.specializations.join(' ')} ${p.careers.join(' ')} ${p.eligibility}`,
        url: `/programs/${p.slug}`,
        type: 'Program',
      })),
      ...this.certifications.map((c) => ({
        id: `idx-${c.id}`,
        title: c.title,
        content: `${c.group} ${c.text} ${c.duration}`,
        url: '/certifications',
        type: 'Certification',
      })),
      ...this.news.map((n) => ({
        id: `idx-${n.id}`,
        title: n.title,
        content: `${n.category} ${n.summary || ''} ${n.content}`,
        url: `/news/${n.slug}`,
        type: 'News',
      })),
      ...this.events.filter(e => e.status === 'PUBLISHED').map((e) => ({
        id: `idx-${e.id}`,
        title: e.title,
        content: `${e.summary} ${e.location || ''}`,
        url: '/events',
        type: 'Event',
      })),
      {
        id: 'idx-admissions',
        title: 'Admissions Process & Documents',
        content: 'admissions apply eligibility documents application status fee process timeline',
        url: '/admissions',
        type: 'Admissions',
      },
      {
        id: 'idx-campus',
        title: 'Campus Life, Hostel & Facilities',
        content: 'hostel cafeteria wifi skill lab campus visit address location directions devanahalli',
        url: '/campus',
        type: 'Facility',
      },
      {
        id: 'idx-placements',
        title: 'Placements & Career Opportunities',
        content: 'recruiters salesforce hcltech itc hdfc bank mtr johnson controls internships career guidance',
        url: '/placements',
        type: 'Page',
      },
      {
        id: 'idx-contact',
        title: 'Contact Admissions & Campus Visit',
        content: 'phone email enquiry callback directions appointment admission@deekshaedu.in',
        url: '/contact',
        type: 'Page',
      },
    ];
  }
}

export const memoryDb = new MemoryDatabase();

let isPostgresAvailable = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPostgresAvailable = true;
    return true;
  } catch {
    isPostgresAvailable = false;
    return false;
  }
}

export function isDbLive(): boolean {
  return isPostgresAvailable;
}
