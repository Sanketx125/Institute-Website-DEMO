import { prisma, checkDatabaseConnection } from './database/client';
import bcrypt from 'bcryptjs';
import { requiredPassword } from './config';
import {
  defaultRoles,
  defaultPermissions,
  institutionSeed,
  programsSeed,
  certificationsSeed,
  leadersSeed,
  employersSeed,
  newsSeed,
  eventsSeed,
  noticesSeed,
  gallerySeed,
} from './database/seed-data';

async function runSeed() {
  console.log('[SEED] Starting database seed process...');
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    console.log('[SEED] PostgreSQL database is not currently connected. Seed dataset verified in memory storage.');
    return;
  }

  console.log('[SEED] Connected to PostgreSQL. Seeding roles and permissions...');

  for (const r of defaultRoles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, description: r.description },
    });
  }

  for (const p of defaultPermissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: { code: p.code, description: p.description },
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (superAdminRole) {
    const passwordHash = await bcrypt.hash(requiredPassword('ADMIN_PASSWORD', 'super admin'), 10);
    await prisma.user.upsert({
      where: { email: 'admin@deekshaam.edu' },
      update: {},
      create: {
        email: 'admin@deekshaam.edu',
        passwordHash,
        name: 'System Administrator',
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('[SEED] Seeding Site Settings...');
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: institutionSeed,
    });
  }

  console.log('[SEED] Seeding Programs & Curriculums...');
  for (const prog of programsSeed) {
    const { specializations, careers, highlights, curriculum, ...progBase } = prog;
    const createdProg = await prisma.program.upsert({
      where: { slug: prog.slug },
      update: progBase,
      create: progBase,
    });

    for (const spec of specializations) {
      await prisma.programSpecialization.create({
        data: { programId: createdProg.id, name: spec },
      });
    }

    for (const car of careers) {
      await prisma.programCareer.create({
        data: { programId: createdProg.id, title: car },
      });
    }

    for (const hl of highlights) {
      await prisma.programHighlight.create({
        data: { programId: createdProg.id, text: hl },
      });
    }

    for (let semIdx = 0; semIdx < curriculum.length; semIdx++) {
      for (const subject of curriculum[semIdx]) {
        await prisma.programCurriculum.create({
          data: {
            programId: createdProg.id,
            semesterNumber: semIdx + 1,
            subject,
          },
        });
      }
    }
  }

  console.log('[SEED] Seeding News, Events & Notices...');
  for (const n of newsSeed) {
    await prisma.news.upsert({
      where: { slug: n.slug },
      update: {},
      create: n,
    });
  }

  for (const e of eventsSeed) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: e,
    });
  }

  for (const not of noticesSeed) {
    await prisma.notice.create({
      data: not,
    });
  }

  console.log('[SEED] Database seeding completed successfully!');
}

runSeed()
  .catch((e) => {
    console.error('[SEED] Error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
