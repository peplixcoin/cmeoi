require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const EventEmitter = require('events'); 
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
// Add to existing imports
const instructionRoutes = require('./routes/instructionRoutes');

const userRoutes = require('./routes/userRoutes');
const menuRoutes = require('./routes/menuRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoute');
const onlineFeedbackRoutes = require('./routes/onlineFeedbackRoute')
const onlineOrderRoutes = require('./routes/onlineOrderRoutes');
const eventRoutes = require('./routes/eventRoute');
const loungeRoutes = require('./routes/loungeRoutes');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = { cloudinary, fs };
const app = express();
const PORT = process.env.PORT || 3000;

// Create a global event emitter for SSE
global.dineOrderEmitter = new EventEmitter();
global.onlineOrderEmitter = new EventEmitter();

app.use(
  cors({
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  })
);
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.send('Hello World');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Could not connect to MongoDB', err);
});


app.use('/api', userRoutes);
app.use('/api', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', orderRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/online/feedback', onlineFeedbackRoutes);
app.use('/api/online', onlineOrderRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lounges', loungeRoutes);
// Add to existing app.use statements
app.use('/api', instructionRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});