const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  mobile_no: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, enum: ['member', 'guest', 'family'], required: true },
  family: [{
    username: { type: String, required: true },
    relation: { 
      type: Number, 
      enum: [2, 3, 4, 5], // 2: wife, 3: son, 4: daughter, 5: parent
      required: true 
    }
  }],
  service: { 
    type: Number, 
    enum: [1, 2, 3, 4], // 1: army, 2: navy, 3: airforce, 4: cadet
    required: true 
  },
  faculty: { type: Number, required: true }
});

module.exports = mongoose.model('User', UserSchema);