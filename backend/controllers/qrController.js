import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const generateQR = async (req, res) => {
  try {
    const { userId, mealType } = req.query;

    if (!userId || !mealType) {
      return res.status(400).json({ message: 'userId and mealType are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 60s so a screenshot of the QR can't be reused at the counter
    const token = jwt.sign({ userId, mealType }, process.env.JWT_SECRET, { expiresIn: '60s' });

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const scanInfo = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // tell the student to regenerate rather than just "invalid"
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'QR code expired. Please generate a new one.' });
      }
      return res.status(401).json({ message: 'Invalid QR code' });
    }

    // this is just a preview — no DB write yet, staff confirms in the next step
    const user = await User.findById(decoded.userId).select('name role rollNumber');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      userId: user._id,
      name: user.name,
      role: user.role,
      rollNumber: user.rollNumber || null,
      mealType: decoded.mealType,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const validateMeal = async (req, res) => {
  try {
    const { token, staffId } = req.body;

    if (!token || !staffId) {
      return res.status(400).json({ message: 'token and staffId are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'QR code expired. Student needs to regenerate.' });
      }
      return res.status(401).json({ message: 'Invalid QR code' });
    }

    const { userId, mealType } = decoded;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // date range query so "today" works regardless of what time the meal was served
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // check if already eaten today before marking as served
    const alreadyServed = await Transaction.findOne({
      userId,
      mealType,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (alreadyServed) {
      return res.status(409).json({
        message: `${mealType} already served to ${user.name} today`,
      });
    }

    // guests have a lifetime meal cap, not just a daily one
    if (user.role === 'guest') {
      const totalGuestMeals = await Transaction.countDocuments({ userId });
      if (totalGuestMeals >= user.guestMealLimit) {
        return res.status(403).json({
          message: `Guest meal limit reached (${user.guestMealLimit} meals used)`,
        });
      }
    }

    const transaction = await Transaction.create({
      userId,
      mealType,
      date: new Date(),
      scannedAt: new Date(),
      servedBy: staffId,
    });

    return res.status(201).json({
      message: `Meal served successfully to ${user.name}`,
      transactionId: transaction._id,
      userName: user.name,
      mealType,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
