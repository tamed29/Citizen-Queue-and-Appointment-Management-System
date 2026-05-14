import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==============================
// PUBLIC CUSTOMER ROUTES
// ==============================

// Walk-in: Join Queue
export const takeTicketPublic = async (req, res) => {
  const { serviceId, customerName, phone, idNumber } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'Missing required fields' });

  const userId = req.user?.id;
  const name = customerName || req.user?.name;
  const userPhone = phone || req.user?.phone;

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { center: true }
    });
    if (!service || !service.isActive) return res.status(404).json({ error: 'Service not available' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const waitingCount = await prisma.queueTicket.count({
      where: { serviceId, status: 'WAITING', createdAt: { gte: today, lt: tomorrow } }
    });

    if (waitingCount >= service.center.maxQueuePerService) {
      return res.status(400).json({ error: 'Queue is full for this service. Please try later or book an appointment.' });
    }

    const totalCount = await prisma.queueTicket.count({
      where: { serviceId, createdAt: { gte: today, lt: tomorrow } }
    });

    const prefix = service.codePrefix || service.name.substring(0, 3).toUpperCase();
    const ticketNumber = `${prefix}-${(totalCount + 1).toString().padStart(3, '0')}`;

    const ticket = await prisma.queueTicket.create({
      data: {
        ticketNumber,
        customerName: name,
        phone: userPhone,
        idNumber,
        serviceId,
        userId,
        position: waitingCount + 1,
      },
      include: { service: { include: { center: true } } }
    });

    const io = req.app.get('io');
    if (io) io.to(`service:${serviceId}`).emit('queue:update', { serviceId });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTicketStatusPublic = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id },
      include: { service: { include: { center: true } } }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Recalculate position dynamically
    if (ticket.status === 'WAITING') {
      const position = await prisma.queueTicket.count({
        where: {
          serviceId: ticket.serviceId,
          status: 'WAITING',
          createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
          OR: [
            { isPriority: true, createdAt: { lt: ticket.createdAt } }, // Priority tickets before this one
            { isPriority: ticket.isPriority, createdAt: { lt: ticket.createdAt } } // Same priority tickets before this one
          ]
        }
      });
      // Ensure priority tickets jump the queue
      const higherPriorityCount = !ticket.isPriority ? await prisma.queueTicket.count({
        where: {
           serviceId: ticket.serviceId, status: 'WAITING', isPriority: true, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
        }
      }) : 0;
      
      ticket.position = position + higherPriorityCount + 1;
      ticket.estimatedWaitTime = ticket.position * ticket.service.avgDurationMin;
    } else {
      ticket.position = 0;
      ticket.estimatedWaitTime = 0;
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTimeSlots = async (req, res) => {
  const { serviceId, date } = req.query;
  if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date required' });

  try {
    const slots = await prisma.timeSlot.findMany({
      where: { serviceId, date, isBlocked: false },
      orderBy: { startTime: 'asc' }
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bookAppointmentPublic = async (req, res) => {
  const { serviceId, customerName, phone, idNumber, scheduledDate, scheduledTime, notes } = req.body;
  if (!serviceId || !scheduledDate || !scheduledTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userId = req.user?.id;
  const name = customerName || req.user?.name;
  const userPhone = phone || req.user?.phone;

  try {
    const slot = await prisma.timeSlot.findFirst({
      where: { serviceId, date: scheduledDate, startTime: scheduledTime }
    });

    if (!slot || slot.isBlocked || slot.bookedCount >= slot.maxCapacity) {
      return res.status(400).json({ error: 'Time slot is not available or fully booked' });
    }

    const refNumber = `APT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const appointment = await prisma.appointment.create({
      data: {
        referenceNumber: refNumber,
        customerName: name,
        phone: userPhone,
        idNumber,
        scheduledDate,
        scheduledTime,
        notes,
        serviceId,
        userId
      },
      include: { service: { include: { center: true } } }
    });

    await prisma.timeSlot.update({
      where: { id: slot.id },
      data: { bookedCount: { increment: 1 } }
    });

    const io = req.app.get('io');
    if (io) io.to(`center:${appointment.service.centerId}`).emit('appointment:new');

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==============================
// CITIZEN ROUTES (Logged In)
// ==============================
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await prisma.queueTicket.findMany({
      where: { userId: req.user.id },
      include: { service: { include: { center: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const cancelTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    if (ticket.userId && ticket.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.queueTicket.update({ where: { id }, data: { status: 'CANCELLED' } });
    const io = req.app.get('io');
    if (io) io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==============================
// STAFF ADMIN ROUTES
// ==============================
export const getMyServiceQueue = async (req, res) => {
  const centerId = req.user.staffCenterId;
  if (!centerId) return res.status(400).json({ error: 'Staff not assigned to a service center' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await prisma.queueTicket.findMany({
      where: {
        service: { centerId },
        createdAt: { gte: today },
        status: { in: ['WAITING', 'CALLED'] }
      },
      orderBy: [
        { isPriority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: { service: true }
    });

    res.json(tickets);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getMyServiceAppointments = async (req, res) => {
  const centerId = req.user.staffCenterId;
  try {
    const appointments = await prisma.appointment.findMany({
      where: { service: { centerId } },
      include: { service: true },
      orderBy: [ { scheduledDate: 'asc' }, { scheduledTime: 'asc' } ]
    });
    res.json(appointments);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const appt = await prisma.appointment.update({
      where: { id },
      data: { status, confirmedByStaffId: req.user.id }
    });
    res.json(appt);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const callNext = async (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'Service ID required' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextTicket = await prisma.queueTicket.findFirst({
      where: { serviceId, status: 'WAITING', createdAt: { gte: today } },
      orderBy: [ { isPriority: 'desc' }, { createdAt: 'asc' } ]
    });

    if (!nextTicket) return res.status(404).json({ error: 'No waiting tickets' });

    const updated = await prisma.queueTicket.update({
      where: { id: nextTicket.id },
      data: { status: 'CALLED', calledAt: new Date() },
      include: { service: true }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`service:${serviceId}`).emit('queue:update', { serviceId });
      io.to(`service:${serviceId}`).emit('queue:called', updated);
    }
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const serveTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'SERVED', servedAt: new Date() }
    });
    const io = req.app.get('io');
    if (io) io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });
    res.json(ticket);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const skipTicket = async (req, res) => {
  const { id } = req.params;
  try {
    // Put back in waiting queue but push to end
    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'WAITING', createdAt: new Date() } // Refreshing createdAt pushes it to back
    });
    const io = req.app.get('io');
    if (io) io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });
    res.json(ticket);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const noShowTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.queueTicket.update({
      where: { id },
      data: { status: 'NO_SHOW' }
    });
    const io = req.app.get('io');
    if (io) io.to(`service:${ticket.serviceId}`).emit('queue:update', { serviceId: ticket.serviceId });
    res.json(ticket);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getServiceHistory = async (req, res) => {
  res.json([]);
};

export const getMyStats = async (req, res) => {
  res.json({});
};
