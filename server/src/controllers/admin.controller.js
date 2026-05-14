import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Existing dashboard stats
export const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTickets,
      servedTickets,
      waitingTickets,
      servedTicketsData,
      ticketsByService,
      hourlyVolume,
      totalStaff,
      activeStaff
    ] = await Promise.all([
      prisma.queueTicket.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.queueTicket.count({ where: { status: 'SERVED', createdAt: { gte: today, lt: tomorrow } } }),
      prisma.queueTicket.count({ where: { status: 'WAITING' } }),
      prisma.queueTicket.findMany({
        where: {
          status: 'SERVED',
          createdAt: { gte: today, lt: tomorrow },
          calledAt: { not: null }
        },
        select: { createdAt: true, calledAt: true }
      }),
      prisma.service.findMany({
        select: {
          name: true,
          _count: {
            select: {
              tickets: {
                where: { createdAt: { gte: today, lt: tomorrow } }
              }
            }
          }
        }
      }),
      prisma.$queryRaw`
        SELECT strftime('%H', createdAt) as hour, count(*) as count
        FROM QueueTicket
        WHERE createdAt >= ${today.toISOString()} AND createdAt < ${tomorrow.toISOString()}
        GROUP BY hour
        ORDER BY hour
      `,
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.user.count({ 
        where: { 
          role: 'STAFF', 
          lastLoginAt: { gte: today } 
        } 
      })
    ]);

    let avgWaitTime = 0;
    if (servedTicketsData.length > 0) {
      const totalWait = servedTicketsData.reduce((acc, t) => {
        return acc + (new Date(t.calledAt) - new Date(t.createdAt));
      }, 0);
      avgWaitTime = Math.round(totalWait / servedTicketsData.length / 60000);
    }

    const formattedHourly = Array.from({ length: 24 }, (_, i) => {
      const match = hourlyVolume.find(h => parseInt(h.hour) === i);
      return { hour: i, count: match ? match.count : 0 };
    });

    res.json({
      totalTickets,
      servedTickets,
      waitingTickets,
      avgWaitTime,
      totalStaff,
      activeStaff,
      ticketsByService: ticketsByService.map(s => ({ name: s.name, count: s._count.tickets })),
      hourlyVolume: formattedHourly
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Citizen management
export const getUsers = async (req, res) => {
  const { search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const where = {
      role: 'CITIZEN',
      ...(search && {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } }
        ]
      })
    };

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isPriority: true,
        createdAt: true,
        _count: {
          select: {
            tickets: true,
            appointments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, phone: true, role: true, isPriority: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const togglePriority = async (req, res) => {
  const { id } = req.params;
  try {
    const currentUser = await prisma.user.findUnique({ where: { id } });
    const user = await prisma.user.update({
      where: { id },
      data: { isPriority: !currentUser.isPriority },
      select: { id: true, name: true, phone: true, role: true, isPriority: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Staff Management
export const createStaffAccount = async (req, res) => {
  const { name, phone, email, password, staffCenterId } = req.body;

  if (!name || !phone || !password || !staffCenterId || !email) {
    return res.status(400).json({ error: 'All fields are required (Name, Phone, Email, Password, Center)' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ error: 'Phone number already taken' });

    if (!email) return res.status(400).json({ error: 'Email is required for staff accounts' });

    const passwordHash = await bcrypt.hash(password, 10);
    const shortCode = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '.');

    const staff = await prisma.user.create({
      data: {
        username: shortCode,
        name,
        phone,
        email: email.toLowerCase(),
        passwordHash,
        role: 'STAFF',
        staffCenterId,
        isActive: true
      },
      select: {
        id: true, username: true, name: true, phone: true, email: true, role: true, 
        staffCenterId: true, isActive: true
      }
    });

    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'STAFF' },
      include: {
        staffCenter: { select: { name: true, type: true } },
      },
      orderBy: [
        { staffCenter: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Manually include service name since it's just a String ID in schema for now
    const staffWithService = await Promise.all(staff.map(async (s) => {
      const service = await prisma.service.findUnique({
        where: { id: s.assignedServiceId },
        select: { name: true }
      });
      return { ...s, assignedService: service };
    }));

    res.json(staffWithService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStaffById = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await prisma.user.findUnique({
      where: { id },
      include: {
        staffCenter: true
      }
    });

    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const service = await prisma.service.findUnique({
      where: { id: staff.assignedServiceId }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const servedToday = await prisma.queueTicket.count({
      where: {
        counter: { label: staff.counterLabel }, // Approx logic for history
        status: 'SERVED',
        servedAt: { gte: today }
      }
    });

    res.json({ ...staff, assignedService: service, servedToday });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, staffCenterId, assignedServiceId, counterLabel } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { name, phone, email, staffCenterId, assignedServiceId, counterLabel },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetStaffPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleStaffActive = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const servedCount = await prisma.queueTicket.count({
      where: { counter: { label: { contains: id } } } // Placeholder check
    });

    if (servedCount > 0) {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Staff deactivated (cannot delete due to history)' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Monitoring
export const getLiveCenterQueue = async (req, res) => {
  const { centerId } = req.params;
  try {
    const services = await prisma.service.findMany({
      where: { centerId },
      include: {
        tickets: {
          where: { 
            status: { in: ['WAITING', 'CALLED'] },
            createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
          },
          include: { user: { select: { name: true } } },
          orderBy: [{ isPriority: 'desc' }, { createdAt: 'asc' }]
        }
      }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReports = async (req, res) => {
  const { centerId, serviceId, dateFrom, dateTo } = req.query;
  try {
    const where = {
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0,0,0,0)),
        lte: dateTo ? new Date(dateTo) : new Date()
      },
      ...(serviceId && { serviceId }),
      ...(centerId && { service: { centerId } })
    };

    const [tickets, stats] = await Promise.all([
      prisma.queueTicket.findMany({
        where,
        include: { service: true, user: true }
      }),
      prisma.queueTicket.groupBy({
        by: ['status'],
        where,
        _count: true
      })
    ]);

    const served = tickets.filter(t => t.status === 'SERVED');
    const avgWait = served.length > 0 
      ? served.reduce((acc, t) => acc + (new Date(t.calledAt) - new Date(t.createdAt)), 0) / served.length / 60000 
      : 0;

    res.json({
      totalTickets: tickets.length,
      served: served.length,
      cancelled: tickets.filter(t => t.status === 'CANCELLED').length,
      skipped: tickets.filter(t => t.status === 'SKIPPED').length,
      avgWaitMinutes: Math.round(avgWait),
      // byService, byStaff, etc would go here
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
