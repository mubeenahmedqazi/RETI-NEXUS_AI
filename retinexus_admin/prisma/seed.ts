// One-time setup: creates the first Admin row so there's a way to log into this app at
// all (no admin self-registration exists by design). Run with: npm run seed
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Bare `tsx` (unlike Next.js's dev/build server) doesn't auto-load .env.local — load it
// explicitly so ADMIN_SEED_EMAIL/PASSWORD are picked up from there.
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME || 'Admin';

  if (!email || !password) {
    throw new Error('Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in .env.local before seeding.');
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`An admin with email ${email} already exists — nothing to do.`);
    return;
  }

  const hashedPassword = await hash(password, 10);
  const admin = await prisma.admin.create({
    data: { email, password: hashedPassword, name },
  });

  console.log(`Created admin: ${admin.email} (id: ${admin.id})`);
  console.log('You can now log in at /login with the ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD from .env.local.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
