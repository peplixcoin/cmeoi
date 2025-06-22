const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const createEvents = async () => {
  try {
    const events = [
      {
        eventId: 'evt_001',
        name: 'Defence Technology Symposium 2025',
        date: new Date('2025-06-15T09:00:00Z'),
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        location: 'CME Auditorium, Pune',
        description: 'A symposium showcasing advancements in defence technologies, including robotics, AI, and military engineering solutions.',
        imageUrl: 'https://example.com/images/defence-symposium.jpg',
        isPaid: true,
        price: 2000,
        guest_price: 1500,
        capacity: 150,
        registeredUsers: [],
      },
      {
        eventId: 'evt_002',
        name: 'Military Engineering Workshop',
        date: new Date('2025-07-10T10:00:00Z'),
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        location: 'CME Training Ground, Pune',
        description: 'Hands-on workshop on modern military engineering techniques, including bridge construction and field fortifications.',
        imageUrl: 'https://example.com/images/engineering-workshop.jpg',
        isPaid: false,
        price: 0,
        guest_price: 0,
        capacity: 200,
        registeredUsers: [],
      },
      {
        eventId: 'evt_003',
        name: 'Defence Expo CME',
        date: new Date('2025-08-05T09:00:00Z'),
        startTime: '09:00 AM',
        endTime: '03:00 PM',
        location: 'CME Exhibition Hall, Pune',
        description: 'An exhibition of indigenous defence equipment and innovations developed by CME students and faculty.',
        imageUrl: 'https://example.com/images/defence-expo.jpg',
        isPaid: true,
        price: 1000,
        guest_price: 800,
        capacity: 100,
        registeredUsers: [],
      },
    ];

    await Event.deleteMany({}); // Optional: clear existing data
    await Event.insertMany(events);

    console.log('Defence-related event data seeded successfully');
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    mongoose.connection.close();
  }
};

createEvents();