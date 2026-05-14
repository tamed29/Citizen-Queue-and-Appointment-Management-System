import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Dashboard Stats ────────────────────────────────────────────────────────

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
      totalStaff,
      totalCenters
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
              tickets: { where: { createdAt: { gte: today, lt: tomorrow } } }
            }
          }
        }
      }),
      prisma.user.count({ where: { role: 'STAFF_ADMIN' } }),
      prisma.serviceCenter.count()
    ]);

    let avgWaitTime = 0;
    if (servedTicketsData.length > 0) {
      const totalWait = servedTicketsData.reduce((acc, t) => {
        return acc + (new Date(t.calledAt) - new Date(t.createdAt));
      }, 0);
      avgWaitTime = Math.round(totalWait / servedTicketsData.length / 60000);
    }

    res.json({
      totalTickets,
      servedTickets,
      waitingTickets,
      avgWaitTime,
      totalStaff,
      totalCenters,
      ticketsByService: ticketsByService.map(s => ({ name: s.name, count: s._count.tickets }))
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── Citizen Management ─────────────────────────────────────────────────────

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
          select: { tickets: true, appointments: true }
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

// ─── Staff Admin Management ─────────────────────────────────────────────────

export const createStaffRebuild = async (req, res) => {
  const { name, email, password, centerType, centerName } = req.body;

  if (!name || !email || !password || !centerType || !centerName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Create the Service Center
    const center = await prisma.serviceCenter.create({
      data: {
        name: centerName,
        type: centerType,
        location: 'Arba Minch'
      }
    });

    // Create the Staff Admin account
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'STAFF_ADMIN',
        staffCenterId: center.id,
        isActive: true
      },
      include: { staffCenter: true }
    });

    const { passwordHash: _, ...staffSafe } = staff;
    res.status(201).json(staffSafe);
  } catch (error) {
    console.error('Staff Rebuild Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'STAFF_ADMIN' },
      include: { staffCenter: true },
      orderBy: { createdAt: 'desc' }
    });
    // Strip password hashes
    const safe = staff.map(({ passwordHash, ...s }) => s);
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStaffById = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await prisma.user.findUnique({
      where: { id },
      include: { staffCenter: { include: { services: true } } }
    });

    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count tickets served today across the whole center
    const servedToday = await prisma.queueTicket.count({
      where: {
        service: { centerId: staff.staffCenterId },
        status: 'SERVED',
        servedAt: { gte: today }
      }
    });

    const { passwordHash, ...staffSafe } = staff;
    res.json({ ...staffSafe, servedToday });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, email, centerType, centerName, password } = req.body;
  try {
    const staff = await prisma.user.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    let updateData = { name, email: email?.toLowerCase() };
    
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update staff user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Update associated service center if fields are provided
    if (centerType || centerName) {
      await prisma.serviceCenter.update({
        where: { id: staff.staffCenterId },
        data: {
          ...(centerName && { name: centerName }),
          ...(centerType && { type: centerType })
        }
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      include: { staffCenter: true }
    });

    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetStaffPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleStaffActive = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
    res.json({ isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if they have served any tickets
    const ticketCount = await prisma.queueTicket.count({
      where: { service: { centerId: (await prisma.user.findUnique({ where: { id }, select: { staffCenterId: true } }))?.staffCenterId } }
    });

    if (ticketCount > 0) {
      // Soft-delete: deactivate instead
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Account deactivated (has historical records)' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Staff account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Live Monitoring ────────────────────────────────────────────────────────

export const getLiveCenterQueue = async (req, res) => {
  const { centerId } = req.params;
  try {
    const services = await prisma.service.findMany({
      where: { centerId },
      include: {
        tickets: {
          where: {
            status: { in: ['WAITING', 'CALLED'] },
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
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

// ─── Reports ────────────────────────────────────────────────────────────────

export const getReports = async (req, res) => {
  const { centerId, serviceId, dateFrom, dateTo } = req.query;
  try {
    const where = {
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0, 0, 0, 0)),
        lte: dateTo ? new Date(dateTo) : new Date()
      },
      ...(serviceId && { serviceId }),
      ...(centerId && { service: { centerId } })
    };

    const [tickets, byStatus] = await Promise.all([
      prisma.queueTicket.findMany({
        where,
        include: { service: { select: { name: true } } }
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
      byStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
