// feedbackController.js
const OnlineFeedback = require('../models/OnlineFeedback');

exports.submitFeedback = async (req, res) => {
  const { username, order_id, ratings, comment } = req.body;

  try {
    const feedback = new OnlineFeedback({
      username,
      order_id,
      ratings,
      comment
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting feedback', error });
  }
};

exports.getUserFeedback = async (req, res) => {
  const { username } = req.params;

  try {
    const feedback = await OnlineFeedback.find({ username });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error });
  }
};