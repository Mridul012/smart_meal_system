import express from 'express';
import { generateQR, scanInfo, validateMeal } from '../controllers/qrController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/generate', protect, generateQR);
router.post('/scan-info', protect, scanInfo);
router.post('/validate', protect, validateMeal);

export default router;
