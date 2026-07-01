// Seeds the bootstrap Super Admin + default settings.
// Run: node --env-file=.env prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Default settings ──
  await prisma.setting.upsert({
    where: { key: 'registration_open' },
    update: {},
    create: { key: 'registration_open', value: 'true' },
  });

  // ── Bootstrap Super Admin ──
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!username || !password) {
    console.warn('⚠️  SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD missing — skipping super admin seed.');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.upsert({
      where: { username },
      update: {}, // never overwrite an existing super admin
      create: {
        name: process.env.SUPERADMIN_NAME || 'Super Admin',
        username,
        email: process.env.SUPERADMIN_EMAIL || `${username}@comun.local`,
        phone: process.env.SUPERADMIN_PHONE || '+910000000000',
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`✓ Super Admin ready: ${admin.username} (${admin.email})`);
  }

  console.log('✓ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
