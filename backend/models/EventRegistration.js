const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  username: { type: String, required: true },
  registrationCode: { type: String, default: "0" },
  numberOfGuests: { type: Number, default: 0 },
  eventPrice: { type: Number, required: true },
  guestPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  qrGenerated: { type: Boolean, default: false }, 
  transaction_id: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);