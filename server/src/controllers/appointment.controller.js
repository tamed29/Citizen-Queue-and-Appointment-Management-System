import { PrismaClient } from '@prisma/client';
import { notifyAppointmentConfirmed } from '../services/notification.service.js';

const prisma = new PrismaClient();

export const getSlots = async (req, res) => {
  const { serviceId, date } = req.query; // date: YYYY-MM-DD

  try {
    const slots = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ];

    const results = await Promise.all(slots.map(async (time) => {
      const scheduledAtStart = new Date(`${date}T${time}:00`);
      const scheduledAtEnd = new Date(scheduledAtStart);
      scheduledAtEnd.setHours(scheduledAtEnd.getHours() + 1);

      const count = await prisma.appointment.count({
        where: {
          serviceId,
          scheduledAt: {
            gte: scheduledAtStart,
            lt: scheduledAtEnd,
          },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      return {
        time,
        available: count < 8,
        remaining: 8 - count,
      };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bookAppointment = async (req, res) => {
  const { serviceId, date, time } = req.body;
  const userId = req.user.id;

  try {
    const scheduledAt = new Date(`${date}T${time}:00`);
    const scheduledAtEnd = new Date(scheduledAt);
    scheduledAtEnd.setHours(scheduledAtEnd.getHours() + 1);

    // Check capacity
    const count = await prisma.appointment.count({
      where: {
        serviceId,
        scheduledAt: {
          gte: scheduledAt,
          lt: scheduledAtEnd,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (count >= 8) {
      return res.status(409).json({ error: 'This time slot is full' });
    }

    // Check if user already has an appointment for this service today
    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existing = await prisma.appointment.findFirst({
      where: {
        userId,
        serviceId,
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'You already have an appointment for this service on this day' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        serviceId,
        scheduledAt,
        status: 'PENDING',
      },
      include: {
        service: { include: { center: true } },
      },
    });

    await notifyAppointmentConfirmed(req.user.phone, appointment.service.name, scheduledAt.toLocaleString());

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const myAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: req.user.id,
        scheduledAt: { gte: new Date() },
      },
      include: {
        service: { include: { center: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Cannot cancel this appointment' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
