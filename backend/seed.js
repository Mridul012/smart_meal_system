import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const users = [
  {
    name: 'Super Admin',
    email: 'admin@mess.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Staff User',
    email: 'staff@mess.com',
    password: 'staff123',
    role: 'staff',
  },
  {
    name: 'Test Student',
    email: 'student@mess.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'NST2024001',
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`Skipping ${userData.email} — already exists`);
      continue;
    }

    const hashed = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashed });
    console.log(`Created: ${userData.email} (${userData.role})`);
  }

  console.log('Seeded successfully');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
