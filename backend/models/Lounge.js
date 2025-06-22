const mongoose = require('mongoose')

const LoungeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  photos: {
    type: [String]
  },
  capacity: {
    type: Number,
    required: true
  }, // guest capacity
  cost: {
    type: Number,
    required: true
  }, // booking cost per day
  barCounters: {
    type: Number,
    required: true
  }, // number of bar counters
  waiters: {
    type: Number,
    required: true
  } // number of waiters (1 per 15-20 guests)
});

module.exports = mongoose.model("Lounge", LoungeSchema);