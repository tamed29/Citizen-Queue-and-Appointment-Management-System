import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCenters = async (req, res) => {
  try {
    const centers = await prisma.serviceCenter.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          include: { counters: true },
        },
      },
    });
    res.json(centers);
  } catch (error) {
    console.error('Get Centers Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCenterById = async (req, res) => {
  const { id } = req.params;
  try {
    const center = await prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        services: {
          include: { counters: true },
        },
        staff: {
          select: { id: true, name: true, role: true }
        }
      },
    });
    if (!center) return res.status(404).json({ error: 'Center not found' });
    res.json(center);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCenter = async (req, res) => {
  const { name, location, type } = req.body;
  try {
    const center = await prisma.serviceCenter.create({
      data: { name, location, type },
    });
    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  const { centerId } = req.params;
  const { name, avgDurationMin } = req.body;
  try {
    const service = await prisma.service.create({
      data: {
        name,
        avgDurationMin: parseInt(avgDurationMin),
        centerId,
      },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCounter = async (req, res) => {
  const { serviceId } = req.params;
  const { label } = req.body;
  try {
    const counter = await prisma.counter.create({
      data: { label, serviceId },
    });
    res.status(201).json(counter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
