mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false
  },
  text: {
    type: String,
    required: false
  }, 
  assignedTo: {
    type: [ObjectId],
    required: true
  }, 
  assignedBy:{
    type: ObjectId,
    required: true
  }, 
  assignedOn:{
    type: Date,
    required: true
  },
  assignedDue:{
    type: Date,
  },
  completed:{
    type: Boolean,
    required: true,
    default: false
  },
  completedBy:{
    type: ObjectId,
  },
  completedOn:{
    type: Date,
  },
  subTasks:{
    type:[ObjectId],
    default: []
  },
  tags:{
    type:[String],
    default:[]
  },
  parentTask:{
    type: ObjectId,
    required: false
  }
})

module.exports = mongoose.model('Task', TaskSchema);