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
  defaultReferralSettings,
} from './seed-data';
import { jobsSeed } from './jobs-seed';
import bcrypt from 'bcryptjs';
import { requiredPassword } from '../config';
import path from 'path';
import fs from 'fs';

export function findProjectRoot(startDir: string): string {
  let cur = startDir;
  while (cur && cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'package.json')) && (fs.existsSync(path.join(cur, 'storage')) || fs.existsSync(path.join(cur, 'apps')))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(__dirname, '../../../..');
}

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
  public agents: any[] = [];
  public agentCommissions: any[] = [];
  public agentPayouts: any[] = [];
  public agentAuditLogs: any[] = [];
  public referralSettings: any = { ...defaultReferralSettings };
  public searchIndex: any[] = [];
  public analyticsEvents: any[] = [];

  private dataFilePath(): string {
    const root = findProjectRoot(__dirname);
    return path.join(root, 'storage/data/app-data.json');
  }

  public loadFromFile() {
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_FILE_PERSISTENCE === 'true') return;
    try {
      const filePath = this.dataFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.siteSettings) this.siteSettings = data.siteSettings;
        if (Array.isArray(data.programs)) this.programs = data.programs;
        if (Array.isArray(data.certifications)) this.certifications = data.certifications;
        if (Array.isArray(data.jobs)) this.jobs = data.jobs;
        if (Array.isArray(data.faculty)) this.faculty = data.faculty;
        if (Array.isArray(data.news)) this.news = data.news;
        if (Array.isArray(data.events)) this.events = data.events;
        if (Array.isArray(data.notices)) this.notices = data.notices;
        if (Array.isArray(data.gallery)) this.gallery = data.gallery;
        if (Array.isArray(data.stories)) this.stories = data.stories;
        if (Array.isArray(data.employers)) this.employers = data.employers;
        if (Array.isArray(data.media)) this.media = data.media;
        if (Array.isArray(data.videos)) this.videos = data.videos;
        if (Array.isArray(data.applications)) this.applications = data.applications;
        if (Array.isArray(data.applicationDocuments)) this.applicationDocuments = data.applicationDocuments;
        if (Array.isArray(data.applicationStatusHistory)) this.applicationStatusHistory = data.applicationStatusHistory;
        if (Array.isArray(data.leads)) this.leads = data.leads;
        if (Array.isArray(data.leadHistory)) this.leadHistory = data.leadHistory;
        if (Array.isArray(data.payments)) this.payments = data.payments;
        if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
        if (Array.isArray(data.agents)) this.agents = data.agents;
        if (Array.isArray(data.agentCommissions)) this.agentCommissions = data.agentCommissions;
        if (Array.isArray(data.agentPayouts)) this.agentPayouts = data.agentPayouts;
        if (Array.isArray(data.agentAuditLogs)) this.agentAuditLogs = data.agentAuditLogs;
        if (data.referralSettings) this.referralSettings = data.referralSettings;
        if (Array.isArray(data.analyticsEvents)) this.analyticsEvents = data.analyticsEvents;

        if (Array.isArray(data.users) && data.users.length > 0) {
          this.users = data.users;
          const adminUser = this.users.find((u: any) => u.id === 'usr-admin-1');
          if (adminUser) {
            adminUser.passwordHash = bcrypt.hashSync(requiredPassword('ADMIN_PASSWORD', 'super admin'), 10);
          }
          const staffUser = this.users.find((u: any) => u.id === 'usr-admissions-1');
          if (staffUser) {
            staffUser.passwordHash = bcrypt.hashSync(requiredPassword('STAFF_PASSWORD', 'admissions staff'), 10);
          }
        }
      }
    } catch (err: any) {
      console.warn('[STORAGE] Failed to load data snapshot from disk, starting with defaults:', err.message);
    }
  }

  public saveToFile() {
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_FILE_PERSISTENCE === 'true') return;
    try {
      const filePath = this.dataFilePath();
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      const snapshot = {
        siteSettings: this.siteSettings,
        programs: this.programs,
        certifications: this.certifications,
        jobs: this.jobs,
        faculty: this.faculty,
        news: this.news,
        events: this.events,
        notices: this.notices,
        gallery: this.gallery,
        stories: this.stories,
        employers: this.employers,
        media: this.media,
        videos: this.videos,
        users: this.users,
        applications: this.applications,
        applicationDocuments: this.applicationDocuments,
        applicationStatusHistory: this.applicationStatusHistory,
        leads: this.leads,
        leadHistory: this.leadHistory,
        payments: this.payments,
        auditLogs: this.auditLogs,
        agents: this.agents,
        agentCommissions: this.agentCommissions,
        agentPayouts: this.agentPayouts,
        agentAuditLogs: this.agentAuditLogs,
        referralSettings: this.referralSettings,
        analyticsEvents: this.analyticsEvents,
      };
      const tmpPath = `${filePath}.${Date.now()}-${Math.random().toString(36).slice(2, 6)}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2), 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      console.error('[STORAGE] Failed to write data snapshot to disk:', err.message);
    }
  }

  constructor() {
    this.loadFromFile();
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
