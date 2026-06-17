import express from 'express';
import { login, register, getUsers, deleteUser } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, adminOnly('admin'), register);
router.get('/users', protect, adminOnly('admin'), getUsers);
router.delete('/users/:id', protect, adminOnly('admin'), deleteUser);

export default router;
