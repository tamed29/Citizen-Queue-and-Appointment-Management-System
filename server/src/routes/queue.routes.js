import { Router } from 'express';
import { 
  takeTicket, 
  getTicketStatus, 
  cancelTicket,
  getMyTickets,
  getMyServiceQueue,
  callNext,
  serveTicket,
  skipTicket,
  getServiceHistory,
  getMyStats,
  getMyServiceAppointments
} from '../controllers/queue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Citizen routes
router.use(authenticate);
router.post('/take', takeTicket);
router.get('/status/:id', getTicketStatus);
router.get('/my', getMyTickets);
router.delete('/:id', cancelTicket);

// Staff routes
router.get('/staff/service', requireRole('STAFF'), getMyServiceQueue);
router.get('/staff/appointments', requireRole('STAFF'), getMyServiceAppointments);
router.post('/staff/call-next', requireRole('STAFF'), callNext);
router.post('/staff/:id/serve', requireRole('STAFF'), serveTicket);
router.post('/staff/:id/skip', requireRole('STAFF'), skipTicket);
router.get('/staff/history', requireRole('STAFF'), getServiceHistory);
router.get('/staff/stats', requireRole('STAFF'), getMyStats);

export default router;
