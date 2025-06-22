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

const createAdmins = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admins = [
      {
        Username: 'manager1',
        Password: hashedPassword,
        mobile_no: '1111111111',
        role: 'Manager',
      },
      {
        Username: 'superadmin1',
        Password: hashedPassword,
        mobile_no: '2222222222',
        role: 'SuperAdmin',
      },
      {
        Username: 'cook1',
        Password: hashedPassword,
        mobile_no: '3333333333',
        role: 'Cook',
      },
       {
        Username: 'ticketscanner1',
        Password: hashedPassword,
        mobile_no: '547667578676',
        role: 'TicketScanner',
      },
       {
        Username: 'deliveryman1',
        Password: hashedPassword,
        mobile_no: '89766867767',
        role: 'DeliveryMan',
      },
    ];

    await Admin.deleteMany({}); // Optional: clear existing data
    await Admin.insertMany(admins);

    console.log('Admin users created successfully');
  } catch (error) {
    console.error('Error creating admin users:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmins();
