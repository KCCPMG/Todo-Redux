const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false,
    required: true
  },
  createTime: {
    type: Date,
    require: true,
    default: new Date()
  },
  todos: {
    type: Array,
    default: [],
    required: true
  },
  confirmLink: String,
  supes: {
    type: [String],
    required: true,
    default: []
  },
  subs: {
    type: [String],
    required: true,
    default: []
  },

})

module.exports = mongoose.model('User', UserSchema);