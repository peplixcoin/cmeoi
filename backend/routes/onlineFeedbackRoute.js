const express = require('express');
const onlineFeedbackController = require('../controllers/onlineFeedbackController');
const router = express.Router();

router.post('/submit', onlineFeedbackController.submitFeedback);

router.get('/:username', onlineFeedbackController.getUserFeedback);

module.exports = router;