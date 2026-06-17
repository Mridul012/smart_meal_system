import express from 'express';
import { getMenu, addMenu } from '../controllers/menuController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMenu);
router.post('/', protect, adminOnly('admin'), addMenu);

export default router;
