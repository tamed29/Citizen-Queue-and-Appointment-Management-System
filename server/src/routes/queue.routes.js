import { Router } from 'express';
import { 
  takeTicketPublic, 
  getTicketStatusPublic, 
  cancelTicket,
  getMyTickets,
  getMyServiceQueue,
  callNext,
  serveTicket,
  skipTicket,
  noShowTicket,
  getServiceHistory,
  getMyStats,
  getMyServiceAppointments,
  getTimeSlots,
  bookAppointmentPublic,
  updateAppointmentStatus
} from '../controllers/queue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// PUBLIC CUSTOMER ROUTES (No auth required)
router.get('/public/status/:id', getTicketStatusPublic);
router.get('/public/slots', getTimeSlots);

// CITIZEN ROUTES (Auth required)
router.use('/my', authenticate);
router.get('/my/tickets', getMyTickets);
router.delete('/my/tickets/:id', cancelTicket);
router.post('/my/join', takeTicketPublic);
router.post('/my/appointments/book', bookAppointmentPublic);

// STAFF ADMIN ROUTES
router.use('/staff', authenticate, requireRole('STAFF_ADMIN'));
router.get('/staff/service', getMyServiceQueue);
router.get('/staff/appointments', getMyServiceAppointments);
router.post('/staff/call-next', callNext);
router.patch('/staff/:id/serve', serveTicket);
router.patch('/staff/:id/skip', skipTicket);
router.patch('/staff/:id/no-show', noShowTicket);
router.patch('/staff/appointments/:id/status', updateAppointmentStatus);

router.get('/staff/history', getServiceHistory);
router.get('/staff/stats', getMyStats);

export default router;
