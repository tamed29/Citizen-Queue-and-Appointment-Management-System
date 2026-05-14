import { Router } from 'express';
import { 
  getStats, 
  getUsers, 
  updateUserRole, 
  togglePriority,
  createStaffAccount,
  getAllStaff,
  getStaffById,
  updateStaff,
  resetStaffPassword,
  toggleStaffActive,
  deleteStaff,
  getLiveCenterQueue,
  getReports
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Publicly accessible stats for Landing page
router.get('/stats', getStats);

// Protected admin routes
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/priority', togglePriority);

// Staff management
router.post('/staff/create', createStaffAccount);
router.get('/staff', getAllStaff);
router.get('/staff/:id', getStaffById);
router.patch('/staff/:id', updateStaff);
router.patch('/staff/:id/reset-password', resetStaffPassword);
router.patch('/staff/:id/toggle-active', toggleStaffActive);
router.delete('/staff/:id', deleteStaff);

// Live Monitoring & Reports
router.get('/centers/:centerId/live', getLiveCenterQueue);
router.get('/reports', getReports);

export default router;
