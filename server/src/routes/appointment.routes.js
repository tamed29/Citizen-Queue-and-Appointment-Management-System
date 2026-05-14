import { Router } from 'express';
import { 
  getSlots, 
  bookAppointment, 
  myAppointments, 
  cancelAppointment 
} from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/slots', authenticate, getSlots);
router.post('/book', authenticate, bookAppointment);
router.get('/my', authenticate, myAppointments);
router.post('/:id/cancel', authenticate, cancelAppointment);

export default router;
