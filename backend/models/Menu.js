import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
  },
  items: [
    {
      type: String,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
