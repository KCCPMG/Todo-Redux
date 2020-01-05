mongoose = require('mongoose');
ObjectId = mongoose.Schema.Types.ObjectId;

const NotificationSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  }, 
  from:{
    type: ObjectId,
    required: true
  },
  to:{
    type: [ObjectId],
    required: true
  },
  type:{
    type: String
  },
  text:{
    type: String
  },
  responses:{
    type: [ObjectId] 
  },
  original_note:{
    type: ObjectId
  },
  requires_response:{
    type: Boolean
  },
  responded_to:{
    type: Boolean
  },
  accepted:{
    type: Boolean
  }
})

module.exports = mongoose.model('Notification', NotificationSchema);