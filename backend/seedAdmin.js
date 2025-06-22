const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const createAdmin = async () => {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = new Admin({
      Username: 'adminOI',
      Password: hashedPassword,
      mobile_no: '9876543210',
      role: 'OI'  // Ensure the role is "OI" for login access
    });

    await admin.save();
    console.log('Admin user created successfully');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.connection.close();
  }
};

createAdmin();
