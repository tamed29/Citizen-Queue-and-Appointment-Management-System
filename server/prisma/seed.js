import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging existing data...');
  
  // Order matters for deletion due to foreign keys
  await prisma.appointment.deleteMany();
  await prisma.queueTicket.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCenter.deleteMany();

  console.log('👑 Creating Super Admin...');
  
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      name: 'CQAMS Super Admin',
      email: 'admin@cqams.gov',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  console.log('✅ Rebuild Seed Successful!');
  console.log('---------------------------');
  console.log('SUPER ADMIN CREDENTIALS:');
  console.log('Email: admin@cqams.gov');
  console.log('Password: admin123');
  console.log('---------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
