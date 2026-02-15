import { PrismaClient } from '@prisma/client';
import { AppUtilities } from '../utilities';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@hymnal.com';
  const password = process.env.ADMIN_PASSWORD || 'Password123!';
  const hashedPassword = await AppUtilities.hashPassword(password);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'Admin',
      status: 'Active',
    },
  });

  console.log(`Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
