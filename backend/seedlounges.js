const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lounge = require('./models/Lounge'); 

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const createLounges = async () => {
  try {
    const lounges = [
      {
        name: 'Aqua Lounge',
        description: 'Premium lounge area with aquatic theme, suitable for small gatherings',
        photos: ['https://example.com/images/aqua-lounge1.jpg', 'https://example.com/images/aqua-lounge2.jpg'],
        capacity: 40,
        cost: 3000, 
        barCounters: 1,
        waiters: 3 
      },
      {
        name: 'Molotov Corner',
        description: 'Cozy corner lounge with vintage decor, ideal for intimate parties',
        photos: ['https://example.com/images/molotov-corner1.jpg', 'https://example.com/images/molotov-corner2.jpg'],
        capacity: 40,
        cost: 3000,
        barCounters: 1,
        waiters: 3
      },
      {
        name: 'Mini Lounge (AC)',
        description: 'Air-conditioned small lounge perfect for comfortable gatherings',
        photos: ['https://example.com/images/mini-lounge-ac1.jpg', 'https://example.com/images/mini-lounge-ac2.jpg'],
        capacity: 40,
        cost: 4000,
        barCounters: 1,
        waiters: 3
      },
      {
        name: 'Mini Lounge',
        description: 'Spacious non-AC lounge for medium-sized events',
        photos: ['https://example.com/images/mini-lounge1.jpg', 'https://example.com/images/mini-lounge2.jpg'],
        capacity: 40,
        cost: 3000,
        barCounters: 1,
        waiters: 3
      },
      {
        name: 'Main Lounge (AC)',
        description: 'Premium air-conditioned main lounge with elegant decor for large events',
        photos: ['https://example.com/images/main-lounge-ac1.jpg', 'https://example.com/images/main-lounge-ac2.jpg'],
        capacity: 80,
        cost: 8000,
        barCounters: 2,
        waiters: 5
      },
      {
        name: 'Main Lounge',
        description: 'Main lounge with elegant decor for large events',
        photos: ['https://example.com/images/main-lounge-ac1.jpg', 'https://example.com/images/main-lounge-ac2.jpg'],
        capacity: 80,
        cost: 6000,
        barCounters: 2,
        waiters: 5
      },
      {
        name: 'Rear Lawn with Stage',
        description: 'Expansive outdoor area with stage, suitable for large gatherings up to 500 people',
        photos: ['https://example.com/images/rear-lawn1.jpg', 'https://example.com/images/rear-lawn2.jpg'],
        capacity: 500,
        cost: 12000,
        barCounters: 2,
        waiters: 6 
      }
    ];

    await Lounge.deleteMany({}); // Optional: clear existing data
    await Lounge.insertMany(lounges);

    console.log('Lounge data seeded successfully');
  } catch (error) {
    console.error('Error seeding lounges:', error);
  } finally {
    mongoose.connection.close();
  }
};

createLounges();