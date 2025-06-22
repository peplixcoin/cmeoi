const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  capacity: { type: Number, required: true },
  guest_price: { type: Number, default: 0 },
  registeredUsers: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);