const express = require('express');
const passport= require('passport');
const mongoose= require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Task = require('./models/Task.js')

// process.env config
dotenv.config({ path: './.env' })

// Passport config
require('./config/passport')(passport)

// DB Config
const dbstring = process.env.MongoURI;

// Host public files
app.use('/public', express.static(__dirname + '/public'));

// Connect to Mongo
mongoose.connect(dbstring, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "));
db.once('open', function(){
  console.log('Connected to Mongo');
});

// Pug
app.set('view engine', 'pug');

// Bodyparser
app.use(express.json());
app.use(express.urlencoded({extended: true}));


// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

// Current Socket Users
// socketId : userId
var users = {};


// Socket connections
io.on('connection', function(socket) {

  let socketId;
  let userId;

  socket.on('declareId', function(data){
    socketId = socket.id
    userId = data.userId;
    users[userId] = socketId;
  })

  socket.on('task-edit', function(data){
    Task.findByIdAndUpdate(data._id, data, {new:true}, function(err, task){
      if (err) console.log(err);
      else { 
        let sockets = [];
        let taskUsers = [...task.assignedTo];
        
        let self_assigned = false;
        for (let tu of taskUsers) {
          if (String(tu) == String(task.assignedBy)) self_assigned = true;
        }
        if (self_assigned==false) taskUsers.push(task.assignedBy);

        for (let taskUser of taskUsers) {
          if (users[taskUser]) sockets.push(users[taskUser]);
        }
        for (let sock of sockets) {
          io.to(sock).emit("task-edit", task);
        }
      }
    })
  })

  socket.on('new-subtask', function(data){

    let subTask = new Task({
      title: data.subTask.title,
      text: data.subTask.text,
      assignedTo: data.subTask.assignedTo,
      assignedBy: data.subTask.assignedBy,
      assignedOn: new Date(),
      assignedDue: data.subTask.assignedDue,
      tags: data.subTask.tags,
      parentTask: data.subTask.parentTask
    });
    subTask.save(function(err, savedSubtask){
      if (err) console.log(err);
      else {
        data.parentTask.subTasks.push(savedSubtask._id);

        Task.findByIdAndUpdate(data.parentTask._id, data.parentTask, {new:true}, function(err, task){

          if(err) console.log(err);
          else {
            let sockets = [];
            let taskUsers = [...task.assignedTo];

            let self_assigned = false;
            for (let tu of taskUsers) {
              if (String(tu) == String(task.assignedBy))
              self_assigned = true;
            }
            if (self_assigned==false) {
              taskUsers.push(task.assignedBy);
            }
            for (let tu of taskUsers) {
              if (users[tu]) {
                sockets.push(users[tu]);
              }
            }
            for (let sock of sockets) {
              io.to(sock).emit('task-edit', task);
            }
          }
        })

        let sockets = [];
        let taskUsers = [...savedSubtask.assignedTo];
        for (let tu of taskUsers) {
          if (users[tu]) sockets.push(users[tu]);
        }
        for (let sock of sockets) {
          io.to(sock).emit('new-subtask', savedSubtask);
        }
      }
    })
  })

  socket.on('disconnect', function() {
    delete users[userId]
  })
})


// use http as req'd by socket.io
http.listen(8080);





// Don't think I need this:

// app.use(express.static(__dirname+'/views'));