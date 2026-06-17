import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
  servedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
