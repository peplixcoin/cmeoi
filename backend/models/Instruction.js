const mongoose = require('mongoose');

const InstructionSchema = new mongoose.Schema({
  instruction: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Instruction', InstructionSchema);