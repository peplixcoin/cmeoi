const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const createUser = async () => {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('user123', 10);

    // Create user
    const user = new User({
      Username: 'user1',
      Password: hashedPassword,
      mobile_no: '9123456789',
      email: 'sampleuser@example.com',
      address: '123 Demo Street, Sample City',
      role: 'member' // or 'guest'
    });

    await user.save();
    console.log('User created successfully');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating user:', error);
    mongoose.connection.close();
  }
};

createUser();
