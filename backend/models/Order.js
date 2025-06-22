const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  table_number: { type: Number, required: true, min: 1, max: 10 },
  order_time: { type: Date, required: true },
  items: [{
    item_id: { type: String, required: true },
    item_name: { type: String, required: true },
    qty: { type: Number, required: true },
    item_price: { type: Number, required: true },
    total_price: { type: Number, required: true }
  }],
  total_amt: { type: Number, required: true },
  order_status: { type: String, enum: ['pending', 'approved', 'completed'], required: true },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed'], required: true },
  completion_time: { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);