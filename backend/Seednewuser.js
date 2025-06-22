const mongoose = require('mongoose');
const User = require('./models/User'); 
const bcrypt = require('bcryptjs');

async function seedUsers() {
  try {
    await mongoose.connect('mongodb+srv://cmeadmin240:bs5uv4KcNe75bJLZ@oi-dining.dmenr.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

     // Hash passwords
    const password1 = await bcrypt.hash('cme', 12);
    const password2 = await bcrypt.hash('password456', 12);
    const password3 = await bcrypt.hash('password789', 12);

    // User 1
    const user1 = new User({
      Username: '1347678SIMR1', // 1 (army), 34 (faculty), 7678 (mobile), SIMR (name), 1 (self)
      Name: 'SIMRANDEEP SINGH',
      Password: password1,
      mobile_no: '9987987678',
      email: 'singhsimran2288@gmail.com',
      address: 'Quarters 101, Officers’ Mess, CME, Pune, Maharashtra',
      role: 'member',
      family: [],
      service: 1, // army
      faculty: 34,
    });

    // User 2
    const user2 = new User({
      Username: '2451234AMIT1', // 2 (navy), 45 (faculty), 1234 (mobile), AMIT (name), 1 (self)
      Name: 'AMIT KUMAR',
      Password: password2,
      mobile_no: '9876541234',
      email: 'amitkumar@example.com',
      address: 'Quarters 202, Faculty Block, CME, Pune, Maharashtra',
      role: 'member',
      family: [
        {
          username: '2451234AMIT2', // wife
          relation: 2, // 2 = wife
        },
        {
          username: '2451234AMIT3', // son
          relation: 3, // 3 = son
        }
      ],
      service: 2, // navy
      faculty: 45,
    });

    // User 3
    const user3 = new User({
      Username: '3678901NEHA1', // 3 (airforce), 67 (faculty), 8901 (mobile), NEHA (name), 1 (self)
      Name: 'NEHA SHARMA',
      Password: password3,
      mobile_no: '9123458901',
      email: 'nehasharma@example.com',
      address: 'Quarters 303, Guest House, CME, Pune, Maharashtra',
      role: 'guest',
      family: [],
      service: 3, // airforce
      faculty: 67,
    });

    await Promise.all([user1.save(), user2.save(), user3.save()]);

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedUsers();