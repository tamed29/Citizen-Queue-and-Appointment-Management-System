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
router.post('/', authenticate, requireRole('ADMIN'), createCenter);
router.post('/:centerId/services', authenticate, requireRole('ADMIN'), createService);
router.post('/services/:serviceId/counters', authenticate, requireRole('ADMIN'), createCounter);

export default router;
