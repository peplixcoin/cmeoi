const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  item_id: { type: String, required: true, unique: true },
  item_name: { type: String, required: true },
  item_cty: { type: String, required: true },
  item_subcty: { type: String, required: true },
  item_price: { type: Number, required: true },
  isveg: {type: Boolean, required: true},
  availability: { type: Boolean, required: true },
  item_img: { type: String, required: true }
});

module.exports = mongoose.model('Menu', MenuSchema);