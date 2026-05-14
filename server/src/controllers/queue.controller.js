import { PrismaClient } from '@prisma/client';
import { notifyTicketCalled } from '../services/notification.service.js';

const prisma = new PrismaClient();

// CITIZEN: Take a ticket
export const takeTicket = async (req, res) => {
  const { serviceId, date: bodyDate } = req.body;
  const userId = req.user.id;

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { center: true },
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });

    const today = bodyDate ? new Date(bodyDate) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ticketCount = await prisma.queueTicket.count({
      where: {
        serviceId,
        createdAt: { gte: today, lt: tomorrow },
        status: { not: 'CANCELLED' },
      },
    });

    const prefix = service.name.substring(0, 3).toUpperCase();
    const ticketNumber = `${prefix}-${(ticketCount + 1).toString().padStart(3, '0')}`;

    const ticket = await prisma.queueTicket.create({
      data: {
        ticketNumber,
        userId,
        serviceId,
        isPriority: req.user.isPriority,
      },
      include: {
        service: { include: { center: true } },
        counter: true,
      },
    });

    const waitingCount = await prisma.queueTicket.count({
      where: {
        serviceId,
        status: 'WAITING',
        createdAt: { gte: today, lt: tomorrow },
      }
    });

    const io = req.app.get('io');
    io.to(`service:${serviceId}`).emit('queue:update', {
      serviceId,
      waiting: waitingCount,
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Take Ticket Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// CITIZEN: Get status
export const getTicketStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id },
      include: {
        service: { include: { center: true } },
        counter: true
      }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CITIZEN: Cancel ticket
export const cancelTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    const io = req.app.get('io');
    io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// STAFF: Get queue for assigned service
export const getMyServiceQueue = async (req, res) => {
  const centerId = req.user.staffCenterId;
  
  if (!centerId && req.user.role !== 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Staff not assigned to a service center' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = { service: { centerId: centerId } };
    
    const tickets = await prisma.queueTicket.findMany({
      where: {
        ...where,
        createdAt: { gte: today, lt: tomorrow },
        status: { in: ['WAITING', 'CALLED'] }
      },
      orderBy: [
        { isPriority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        user: { select: { name: true, isPriority: true } },
        service: true
      }
    });

    // Mask names
    const maskedTickets = tickets.map(t => ({
      ...t,
      userName: t.user.name.split(' ')[0] + (t.user.name.split(' ')[1] ? ` ${t.user.name.split(' ')[1][0]}.` : '')
    }));

    res.json(maskedTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const callNext = async (req, res) => {
  let { serviceId } = req.body;
  const centerId = req.user.staffCenterId;

  if (!serviceId && centerId) {
    // If no serviceId provided but has center, pick the oldest waiting ticket in the center
    const oldest = await prisma.queueTicket.findFirst({
      where: {
        service: { centerId: centerId },
        status: 'WAITING',
        createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      },
      orderBy: [{ isPriority: 'desc' }, { createdAt: 'asc' }]
    });
    if (oldest) serviceId = oldest.serviceId;
  }

  if (!serviceId) return res.status(400).json({ error: 'Service ID required' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextTicket = await prisma.queueTicket.findFirst({
      where: {
        serviceId,
        status: 'WAITING',
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: [
        { isPriority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        user: { select: { phone: true, name: true } }
      }
    });

    if (!nextTicket) return res.status(404).json({ error: 'No waiting tickets' });

    // Update staff counter context if needed - for now use user's counterLabel
    const updatedTicket = await prisma.queueTicket.update({
      where: { id: nextTicket.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
        // We'll use the staff's counter label from their profile
      },
      include: { service: true }
    });

    const io = req.app.get('io');
    io.to(`service:${serviceId}`).emit('queue:called', {
      ticketNumber: updatedTicket.ticketNumber,
      counterLabel: 'Center Admin'
    });

    await notifyTicketCalled(nextTicket.user.phone, updatedTicket.ticketNumber, 'Center Admin');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// STAFF: Serve ticket
export const serveTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'SERVED', servedAt: new Date() }
    });

    const io = req.app.get('io');
    io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// STAFF: Skip ticket
export const skipTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'SKIPPED' }
    });

    const io = req.app.get('io');
    io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// STAFF: Service History
export const getServiceHistory = async (req, res) => {
  const serviceId = req.user.assignedServiceId;
  const centerId = req.user.staffCenterId;
  const { date } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where = serviceId ? { serviceId } : { service: { centerId: centerId } };
    where.status = { in: ['SERVED', 'SKIPPED'] };
    where.createdAt = { gte: targetDate, lt: nextDay };

    const tickets = await prisma.queueTicket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.queueTicket.count({ where });

    res.json({ tickets, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyStats = async (req, res) => {
  const centerId = req.user.staffCenterId;
  const today = new Date();
  today.setHours(0,0,0,0);

  try {
    const where = { service: { centerId: centerId } };
    
    const [served, skipped, waiting, appointments] = await Promise.all([
      prisma.queueTicket.count({ where: { ...where, status: 'SERVED', createdAt: { gte: today } } }),
      prisma.queueTicket.count({ where: { ...where, status: 'SKIPPED', createdAt: { gte: today } } }),
      prisma.queueTicket.count({ where: { ...where, status: 'WAITING', createdAt: { gte: today } } }),
      prisma.appointment.count({ where: { ...where, createdAt: { gte: today } } })
    ]);

    res.json({ servedCount: served, skippedCount: skipped, currentWaiting: waiting, totalAppointments: appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyServiceAppointments = async (req, res) => {
  const centerId = req.user.staffCenterId;
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const where = { service: { centerId: centerId } };
    
    const appointments = await prisma.appointment.findMany({
      where: {
        ...where,
        scheduledAt: { gte: today, lt: tomorrow }
      },
      include: { user: { select: { name: true, phone: true, isPriority: true } } },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CITIZEN: Get my tickets (today)
export const getMyTickets = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await prisma.queueTicket.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: today, lt: tomorrow },
        status: { not: 'CANCELLED' }
      },
      include: {
        service: { include: { center: true } },
        counter: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
