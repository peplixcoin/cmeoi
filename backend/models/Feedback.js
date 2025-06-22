// Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  username: { type: String, required: true },
  order_id: { type: String, required: true },
  ratings: {
    taste: { type: Number, required: true, min: 1, max: 5 },
    service: { type: Number, required: true, min: 1, max: 5 },
    hygiene: { type: Number, required: true, min: 1, max: 5 },
    behavior: { type: Number, required: true, min: 1, max: 5 }
  },
  comment: { type: String, required: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);