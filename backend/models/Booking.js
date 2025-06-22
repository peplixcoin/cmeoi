const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  loungeId: {
    type: String,
    required: true
  },
  lounge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lounge' 
  },
  bookingDate: {
    type: Date,
    required: true
  },
  guestsCount: {
    type: Number,
    required: true
  },
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  catering: {
    type: String,
    enum: ["OI", "Outsourced"],
    required: true
  },
  additionalBarCounter: {
    type: Number,
    default: 0 // 2 staff members per additional bar counter
  },
  additionalWaiters: {
    type: Number,
    default: 0
  },
  music: {
    type: Boolean,
    required: false
  },
  occasion: {
    type: String,
    enum: ['marriage function', 'private party'],
    required: true
  },
  securityDeposit: {
    type: Number,
    required: true,
    default: 1000, // 10000 for marriage function, 1000 for private party
    enum: [1000, 10000]
  },
  bookingTotal: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  ownArrangements: {
    generatorBackup: { type: Boolean, default: false },
    additionalFurniture: { type: Boolean, default: false },
    additionalLighting: { type: Boolean, default: false }
  },
  dignitaries: [{
    rank: { type: String, required: false },
    name: { type: String, required: true },
    designation: { type: String, required: false }
  }],
  transactionId: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});


module.exports = mongoose.model("Booking", BookingSchema);