import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // password is excluded by default in the schema, have to ask for it explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || null,
      },
    });
  } catch (error) {
    console.log('Login error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, guestMealLimit } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // 10 rounds — less is insecure, more gets noticeably slow
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      rollNumber: rollNumber || undefined,
      guestMealLimit: guestMealLimit || 3,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || null,
      },
    });
  } catch (error) {
    console.log('Register error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    console.log('Get users error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // can't let admin delete themselves by accident
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: `User ${user.name} deleted successfully` });
  } catch (error) {
    console.log('Delete user error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
