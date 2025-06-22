const Instruction = require('../models/Instruction');

// Fetch all instructions
exports.getAllInstructions = async (req, res) => {
  try {
    const instructions = await Instruction.find().sort({ createdAt: -1 });
    res.json(instructions);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new instruction
exports.addInstruction = async (req, res) => {
  try {
    const { instruction } = req.body;
    if (!instruction) {
      return res.status(400).json({ message: 'Instruction text is required' });
    }
    const newInstruction = new Instruction({ instruction });
    await newInstruction.save();
    res.status(201).json(newInstruction);
  } catch (error) {
    console.error('Error adding instruction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an instruction
exports.updateInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const { instruction } = req.body;
    if (!instruction) {
      return res.status(400).json({ message: 'Instruction text is required' });
    }
    const updatedInstruction = await Instruction.findByIdAndUpdate(
      id,
      { instruction, createdAt: new Date() }, // Update createdAt for sorting
      { new: true }
    );
    if (!updatedInstruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    res.json(updatedInstruction);
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an instruction
exports.deleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInstruction = await Instruction.findByIdAndDelete(id);
    if (!deletedInstruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    res.json({ message: 'Instruction deleted successfully' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};