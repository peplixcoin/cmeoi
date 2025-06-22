// node js backend admin schema page

const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  mobile_no: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'SuperAdmin', 'Cook', 'DeliveryMan', 'TicketScanner'], required: true }
});

module.exports = mongoose.model('Admin', AdminSchema);