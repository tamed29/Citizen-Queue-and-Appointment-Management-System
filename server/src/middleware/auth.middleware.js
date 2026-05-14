import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  const token = req.cookies.cqams_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isPriority: true,
        isActive: true,
        staffCenterId: true,
        assignedServiceId: true,
        counterLabel: true
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled. Contact admin.' });
    }

    // Update lastLoginAt to show recent activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired' });
  }
};
