import { Router } from 'express';
import { register, login, logout, me, updatePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.patch('/update-password', authenticate, updatePassword);

export default router;
