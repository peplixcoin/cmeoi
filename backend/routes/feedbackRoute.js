const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const router = express.Router();

router.post('/submit', feedbackController.submitFeedback);

router.get('/:username', feedbackController.getUserFeedback);

module.exports = router;