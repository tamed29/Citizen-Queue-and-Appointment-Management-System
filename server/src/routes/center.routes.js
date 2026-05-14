import { Router } from 'express';
import { 
  getCenters, 
  getCenterById, 
  createCenter, 
  createService, 
  createCounter 
} from '../controllers/center.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getCenters);
router.get('/:id', getCenterById);
router.get('/:id/services', getCenterById); // To fetch services for the dashboard

router.post('/', authenticate, requireRole('SUPER_ADMIN'), createCenter);
router.post('/:centerId/services', authenticate, requireRole('SUPER_ADMIN', 'STAFF_ADMIN'), createService);
router.post('/services/:serviceId/counters', authenticate, requireRole('SUPER_ADMIN', 'STAFF_ADMIN'), createCounter);

export default router;
