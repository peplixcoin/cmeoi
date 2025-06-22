const mongoose = require('mongoose');

const OnlineOrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  order_time: { type: Date, required: true },
  address: { type: String, required: true },
  mobile_no: { type: String, required: true },
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
  completion_time: { type: Date },
  deliverymanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } // New field for delivery man
});

module.exports = mongoose.model('OnlineOrder', OnlineOrderSchema);