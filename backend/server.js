import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import qrRoutes from './routes/qr.js';
import menuRoutes from './routes/menu.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://smart-meal-system-fbaoqk4m9-mriduls-projects-270d99d3.vercel.app',
  'https://smart-meal-system-nu.vercel.app',
  'https://smart-meal-system-git-main-mriduls-projects-270d99d3.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/menu', menuRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Meal System API is running' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
