import mongoose from 'mongoose';

const dailyinfoSchema = new mongoose.Schema({
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  log: { type: String, required: true, trim: true, maxlength: 1000 },
  notes: { type: String, trim: true, maxlength: 150 },
  mood: { type: String, enum: ['happy', 'sad', 'peaceful', 'angry', 'stressed'] }
}, { collection: process.env.MONGODB_COLLECTION || 'daily_info', autoIndex: false });

export const DailyInfo = mongoose.models.DailyInfo || mongoose.model('DailyInfo', dailyinfoSchema);
