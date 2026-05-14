import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  // Clear existing data for a clean seed
  await prisma.appointment.deleteMany();
  await prisma.queueTicket.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCenter.deleteMany();

  // 1. Create Centers
  const centersData = [
    {
      id: 'cbe-main',
      name: 'Commercial Bank of Ethiopia',
      location: 'Arba Minch Main Branch',
      type: 'Bank',
      services: [
        { name: 'Account Opening', duration: 15 },
        { name: 'Cash Withdrawal', duration: 5 },
        { name: 'Loan Application', duration: 30 },
        { name: 'Foreign Currency Exchange', duration: 20 },
      ],
    },
    {
      id: 'ethio-telecom',
      name: 'Ethio Telecom',
      location: 'Arba Minch Service Center',
      type: 'Telecom',
      services: [
        { name: 'SIM Registration', duration: 10 },
        { name: 'Bill Payment', duration: 5 },
        { name: 'Internet Package', duration: 8 },
        { name: 'Device Support', duration: 15 },
      ],
    },
    {
      id: 'amh-hospital',
      name: 'Arba Minch General Hospital',
      location: 'Arba Minch',
      type: 'Hospital',
      services: [
        { name: 'Outpatient Registration', duration: 8 },
        { name: 'Laboratory', duration: 12 },
        { name: 'Pharmacy', duration: 6 },
        { name: 'Radiology', duration: 20 },
      ],
    },
  ];

  for (const c of centersData) {
    const center = await prisma.serviceCenter.create({
      data: {
        id: c.id,
        name: c.name,
        location: c.location,
        type: c.type,
      },
    });

    for (const s of c.services) {
      const service = await prisma.service.create({
        data: {
          name: s.name,
          avgDurationMin: s.duration,
          centerId: center.id,
        },
      });

      await prisma.counter.createMany({
        data: [
          { label: `Counter A`, serviceId: service.id },
          { label: `Counter B`, serviceId: service.id },
        ],
      });
    }
  }

  // 2. Create Users
  // System Admin - with USERNAME 'admin'
  await prisma.user.create({
    data: {
      username: 'admin',
      name: 'System Admin',
      phone: '0911000001',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Fetch created data for specific assignment
  const cbeCenter = await prisma.serviceCenter.findFirst({ where: { name: { contains: 'Commercial' } }, include: { services: true } });
  const telecomCenter = await prisma.serviceCenter.findFirst({ where: { name: { contains: 'Telecom' } }, include: { services: true } });
  const hospitalCenter = await prisma.serviceCenter.findFirst({ where: { name: { contains: 'Hospital' } }, include: { services: true } });

  // CBE Staff
  const cbeAccountOpening = cbeCenter.services.find(s => s.name === 'Account Opening');
  const cbeLoan = cbeCenter.services.find(s => s.name === 'Loan Application');

  await prisma.user.create({
    data: {
      username: 'cbe.chala',
      name: 'Chala Bekele', phone: '0911100001',
      email: 'cbe.chala@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: cbeCenter.id,
      assignedServiceId: cbeAccountOpening.id, counterLabel: 'Counter A', isActive: true
    }
  });

  await prisma.user.create({
    data: {
      username: 'cbe.mekdes',
      name: 'Mekdes Hailu', phone: '0911100002',
      email: 'cbe.mekdes@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: cbeCenter.id,
      assignedServiceId: cbeLoan.id, counterLabel: 'Counter B', isActive: true
    }
  });

  // Telecom Staff
  const simService = telecomCenter.services.find(s => s.name === 'SIM Registration');
  const billService = telecomCenter.services.find(s => s.name === 'Bill Payment');

  await prisma.user.create({
    data: {
      username: 'telecom.yonas',
      name: 'Yonas Alemu', phone: '0911200001',
      email: 'telecom.yonas@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: telecomCenter.id,
      assignedServiceId: simService.id, counterLabel: 'Window 1', isActive: true
    }
  });

  await prisma.user.create({
    data: {
      username: 'telecom.sara',
      name: 'Sara Tekle', phone: '0911200002',
      email: 'telecom.sara@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: telecomCenter.id,
      assignedServiceId: billService.id, counterLabel: 'Window 2', isActive: true
    }
  });

  // Hospital Staff
  const outpatientService = hospitalCenter.services.find(s => s.name === 'Outpatient Registration');
  const pharmacyService = hospitalCenter.services.find(s => s.name === 'Pharmacy');

  await prisma.user.create({
    data: {
      username: 'hospital.biruk',
      name: 'Biruk Desta', phone: '0911300001',
      email: 'hospital.biruk@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: hospitalCenter.id,
      assignedServiceId: outpatientService.id, counterLabel: 'Desk 1', isActive: true
    }
  });

  await prisma.user.create({
    data: {
      username: 'hospital.hiwot',
      name: 'Hiwot Girma', phone: '0911300002',
      email: 'hospital.hiwot@cqams', passwordHash: staffHash,
      role: 'STAFF', staffCenterId: hospitalCenter.id,
      assignedServiceId: pharmacyService.id, counterLabel: 'Pharmacy Window', isActive: true
    }
  });

  // Citizen
  await prisma.user.create({
    data: {
      name: 'Test Citizen',
      phone: '0911000003',
      passwordHash: userHash,
      role: 'CITIZEN',
      isPriority: false,
    },
  });

  console.log('✅ Seed completed successfully');
  console.log('---------------------------------');
  console.log('ADMIN LOGIN (System Admin):');
  console.log('  Username: admin  Password: admin123');
  console.log('---------------------------------');
  console.log('STAFF LOGINS (Username / Password):');
  console.log('  Chala Bekele   → cbe.chala / staff123');
  console.log('  Mekdes Hailu   → cbe.mekdes / staff123');
  console.log('  Yonas Alemu    → telecom.yonas / staff123');
  console.log('  Sara Tekle     → telecom.sara / staff123');
  console.log('  Biruk Desta    → hospital.biruk / staff123');
  console.log('  Hiwot Girma    → hospital.hiwot / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
