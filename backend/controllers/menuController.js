import Menu from '../models/Menu.js';

export const getMenu = async (req, res) => {
  try {
    // date range so the query works no matter what time of day it runs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const menu = await Menu.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('createdBy', 'name');

    return res.status(200).json(menu);
  } catch (error) {
    console.log('Get menu error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addMenu = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;

    if (!date || !mealType || !items || items.length === 0) {
      return res.status(400).json({ message: 'date, mealType and items are required' });
    }

    const menu = await Menu.create({
      date: new Date(date),
      mealType,
      items,
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: 'Menu added successfully', menu });
  } catch (error) {
    console.log('Add menu error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
