const express = require('express');
const passport= require('passport');
const mongoose= require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Task = require('./models/Task.js')
const User = require('./models/User.js')
const Notification = require('./models/Notification.js');

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

// {userId : {socketId: socket, socketId: socket...}}
var users = {};


io.on('connection', function(socket) {

  let socketId;
  let userId;

  function notifyUser(userId, eventName, event) {
    if (users[userId]) {
      for (let sockId of Object.keys(users[userId])) {
        users[userId][sockId].emit(eventName, event);
      }
    }
  }

  socket.on('declareId', function(data){
    socketId = socket.id
    userId = data.userId;

    if (!users[userId]) users[userId] = {};
    users[userId][socketId] = socket;
  })

  socket.on('read-messages', function(data){
    User.findById(userId, function(err, data){
      if (err) console.log(err);
      else data.unreadNotifications=false;
      data.save(function(err){
        if (err) console.log(err);
      })
    })
  })

  socket.on('task-edit', function(data){
    Task.findByIdAndUpdate(data._id, data, {new:true}, function(err, task){
      if (err) console.log(err);
      else { 
        let sockets = [];
        let user_ids = [...task.assignedTo];
        
        let self_assigned = false;
        for (let tu of user_ids) {
          if (String(tu) == String(task.assignedBy)) self_assigned = true;
        }
        if (self_assigned==false) user_ids.push(task.assignedBy);

        for (let user_id of user_ids) {
          if (users[user_id]) {
            let userObj = users[user_id]
            for (let sock_id of Object.keys(userObj)) {
              let socket = userObj[sock_id];
              socket.emit('task-edit', task);
            }
          }
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
            let user_ids = [...task.assignedTo];

            let self_assigned = false;
            for (let tu of user_ids) {
              if (String(tu) == String(task.assignedBy)) self_assigned = true;
            }
            if (self_assigned==false) {
              user_ids.push(task.assignedBy);
            }

            for (let user_id of user_ids) {
              if (users[user_id]) {
                let userObj = users[user_id]
                for (let sock_id of Object.keys(userObj)) {
                  let socket = userObj[sock_id];
                  socket.emit('task-edit', task);
                }
              }
            }
          }
        })

        let user_ids = [...savedSubtask.assignedTo];

        for (let user_id of user_ids) {
          if (users[user_id]) {
            let userObj = users[user_id]
            for (let sock_id of Object.keys(userObj)) {
              let socket = userObj[sock_id];
              socket.emit('new-subtask', savedSubtask);
            }
          }
        }
      }
    })
  })

  socket.on('new-notification', function(data){

    let found_users = [];
    let unfound_users = [];
    let errors = [];
    let promises = [];

    for (let email of data.to) {
      promises.push(User.findOne({email: email}));
    }

    Promise.all(promises).then(function(res){

      for (let query of res) {
        found_users.push(query._id);

        for (let fu of found_users) {
          User.findById(fu, function(err, doc){
            if (err) console.log(err);
            else {
              doc.unreadNotifications = true;
              doc.save(function(err){
                if (err) console.log(err);
                else {
                  notifyUser(doc._id, 'new-message')
                }
              })
            }
          })
        }
      }

      let note = new Notification({
        from: data.fromID,
        to: found_users,
        type: data.type,
        text: data.text,
        responses: typeof data.reponses!=undefined ? data.responses : null,
        original_note: typeof data.original_note!=undefined ? data.original_note : null,
        requires_response: typeof data.requires_reponse!=undefined ? data.requires_response : null,
        responded_to: typeof data.responded_to!=undefined ? data.responded_to : null,
        accepted: typeof data.accepted!=undefined ? data.accepted : null

      });

  
      note.save(function(err){
        if (err) socket.emit('message-status', err);
        else {
          let message = "You successully sent a " + data.type + ".";
          if (unfound_users.length>0) {
            message+="But the message could not be sent to " + unfound_users
          }
          socket.emit('message-status', message);

          if (note.original_note) {
            Notification.findById(mongoose.Types.ObjectId(note.original_note), function(err, data){

              if (err) console.log(err);
              else if (data==null) console.log("Original Note not found")
              else {
                data.responses.push(note._id);

                if (note.type.match('Accept')) {
                  data.responded_to=true;
                  data.accepted=true;

                  let requesterId = note.to[0] //person who sent request
                  let accepterId = note.from //person who accepted request
                  let permissionQueries = [];
                  permissionQueries.push(User.findById(requesterId));
                  permissionQueries.push(User.findById(accepterId));

                  Promise.all(permissionQueries).then(function(res){
                    let requester = res[0];
                    let accepter = res[1];

                    // Clear prior connections
                    requester.supes = requester.supes.filter((id) => id!=accepter._id);
                    requester.subs = requester.subs.filter((id) => id!=accepter._id);
                    accepter.supes = accepter.supes.filter((id) => id!=requester._id);
                    accepter.subs = accepter.subs.filter((id) => id!=requester._id);

                    if (note.type.match("Add As Sub")) {
                      requester.subs.push(accepterId);
                      accepter.supes.push(requesterId);
                    }
                    else if (note.type.match("Add As Supe")) {
                      requester.supes.push(accepterId);
                      accepter.supes.push(requesterId);
                    }
                    else if (note.type.match("Add As Collab")) {
                      requester.subs.push(accepterId);
                      accepter.supes.push(requesterId);
                      requester.supes.push(accepterId);
                      accepter.supes.push(requesterId);
                    }

                    requester.save(function(err){
                      if (err) console.log(err);
                      else notifyUser(requester._id, 'message', note);
                    })

                    accepter.save(function(err){
                      if (err) console.log(err);
                      notifyUser(accepter._id, 'message', note);
                    })

                  }).catch(function(err){
                    console.log(err);
                  })
                }

                data.save(function(err){
                  if (err) console.log('Save Error: ', err);
                });
              }
            })
          }
        }
      })
    }).catch(function(error){
      console.log(error);
      if (errors.length>0) socket.emit('message-status', 'something went wrong');
    })

  })

  socket.on('disconnect', function(socket) {
    if (users[userId]){
      delete users[userId][socket.id]
      if (users[userId].length==0) delete users[userId]
    }
  })
})

// use http as req'd by socket.io
http.listen(8080);