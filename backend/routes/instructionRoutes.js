const express = require('express');
const router = express.Router();
const instructionController = require('../controllers/instructionController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// Fetch all instructions (public or authenticated)
router.get('/instructions', instructionController.getAllInstructions);
// Add a new instruction (admin only)
router.post('/instructions',  instructionController.addInstruction);
// Update an instruction (admin only)
router.put('/instructions/:id',  instructionController.updateInstruction);
// Delete an instruction (admin only)
router.delete('/instructions/:id', instructionController.deleteInstruction);

module.exports = router;