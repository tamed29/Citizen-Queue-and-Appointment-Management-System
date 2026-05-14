import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging existing data...');
  
  await prisma.timeSlot.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.queueTicket.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCenter.deleteMany();

  console.log('👑 Creating Super Admin...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      name: 'CQAMS Super Admin',
      email: 'admin@cqams.gov',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  const centers = [
    { name: 'Ethio Telecom Main', type: 'Telecom', location: 'Addis Ababa', email: 'telecom@cqams.gov', services: [
      { name: 'SIM Registration', codePrefix: 'SIM', duration: 10 },
      { name: 'Bill Payment', codePrefix: 'BIL', duration: 5 },
      { name: 'Data Package', codePrefix: 'DAT', duration: 8 }
    ]},
    { name: 'Commercial Bank CBE', type: 'Bank', location: 'Bole Branch', email: 'bank@cqams.gov', services: [
      { name: 'Account Opening', codePrefix: 'ACC', duration: 20 },
      { name: 'Loan Services', codePrefix: 'LON', duration: 30 },
      { name: 'Fund Transfer', codePrefix: 'FND', duration: 10 }
    ]},
    { name: 'St. Paul Hospital', type: 'Hospital', location: 'Swaziland St', email: 'hospital@cqams.gov', services: [
      { name: 'General Consultation', codePrefix: 'GEN', duration: 15 },
      { name: 'Laboratory', codePrefix: 'LAB', duration: 25 },
      { name: 'Pharmacy', codePrefix: 'PHR', duration: 10 },
      { name: 'Emergency', codePrefix: 'EMR', duration: 30 }
    ]},
    { name: 'Immigration Office', type: 'Other', location: 'Arat Kilo', email: 'other@cqams.gov', services: [
      { name: 'Passport Renewal', codePrefix: 'PAS', duration: 15 },
      { name: 'Visa Processing', codePrefix: 'VIS', duration: 20 }
    ]}
  ];

  const today = new Date().toISOString().split('T')[0];

  for (const c of centers) {
    console.log(`Building ${c.name} (${c.type})...`);
    
    const center = await prisma.serviceCenter.create({
      data: {
        name: c.name,
        type: c.type,
        location: c.location,
        workingHoursStart: "08:00",
        workingHoursEnd: "17:00",
      }
    });

    await prisma.user.create({
      data: {
        name: `${c.type} Staff Admin`,
        email: c.email,
        passwordHash,
        role: 'STAFF_ADMIN',
        staffCenterId: center.id,
        isActive: true
      }
    });

    for (let i = 0; i < c.services.length; i++) {
      const s = c.services[i];
      const service = await prisma.service.create({
        data: {
          name: s.name,
          codePrefix: s.codePrefix,
          avgDurationMin: s.duration,
          displayOrder: i,
          centerId: center.id
        }
      });

      // Create some TimeSlots for Appointments for today
      await prisma.timeSlot.createMany({
        data: [
          { serviceId: service.id, date: today, startTime: "09:00", endTime: "09:30", maxCapacity: 2 },
          { serviceId: service.id, date: today, startTime: "09:30", endTime: "10:00", maxCapacity: 2 },
          { serviceId: service.id, date: today, startTime: "10:00", endTime: "10:30", maxCapacity: 2 },
          { serviceId: service.id, date: today, startTime: "14:00", endTime: "14:30", maxCapacity: 2 },
        ]
      });
    }
  }

  console.log('✅ Seed Complete!');
  console.log('Super Admin: admin@cqams.gov / admin123');
  console.log('Staff Admins: telecom@cqams.gov, bank@cqams.gov, hospital@cqams.gov, other@cqams.gov (all use admin123)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
