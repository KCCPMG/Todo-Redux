const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification.js');
const bcrypt = require('bcryptjs');
const pug = require('pug');
const dotenv = require('dotenv')

const refreshLocals = require('../config/refreshLocals');
dotenv.config({ path: '../.env' })


router.get('/', function(req, res) {
  res.render('../views/index', {
    messages: req.session.messages
  });
});


router.get('/dashboard', ensureAuthenticated, refreshLocals, function(req, res) {
  res.render('../views/dashboard', {
    name: req.user.name,
    messages: req.session.messages,
    id: req.user.id,
    subs: req.session.subs,
    supes: req.session.supes,
    known_associates: req.session.known_associates,
    tasks_assigned: req.session.tasks_assigned,
    user_tasks : req.session.user_tasks,
    unreadNotifications: Boolean(req.user.unreadNotifications),
    filters: req.user.filters
  });
});


router.get('/tasks', ensureAuthenticated, refreshLocals, function(req, res){
  Task.find({assignedTo: req.user._id}, function(err, tasks){
    if (err) console.log(err);
    else {
      req.session.user_tasks = tasks;
      res.render('taskView', {
        name: req.user.name,
        messages: req.session.messages,
        id: req.user.id,
        subs: req.session.subs,
        supes: req.session.supes,
        tasks: req.session.user_tasks,
        known_associates: req.session.known_associates,
        unreadNotifications: Boolean(req.user.unreadNotifications),
        filters: req.user.filters,
        active_filter: {}
      });
    }
  })

})

router.get('/assigned', ensureAuthenticated, refreshLocals, function(req, res){
  Task.find({assignedBy: req.user._id}, function(err, tasks){
    if (err) console.log(err);
    else {
      req.session.tasks_assigned = tasks;
      res.render('taskView', {
        name: req.user.name,
        messages: req.session.messages,
        id: req.user.id,
        subs: req.session.subs,
        supes: req.session.supes,
        tasks: req.session.tasks_assigned,
        known_associates: req.session.known_associates,
        unreadNotifications: Boolean(req.user.unreadNotifications),
        filters: req.user.filters,
        active_filter: {}
      });
    }
  })
})

router.get('/task', ensureAuthenticated, refreshLocals, function(req, res){
  let taskID = req.query.taskID.replace(/\"/g, '');

  Task.find({$or: [{assignedBy:req.user._id}, {assignedTo:req.user._id}]}, function(err, tasks){
    if (err) console.log(err);
    else {
      let soughtTask = tasks.find((t)=>t._id == taskID);
      let tasksToSend = [];
      if (soughtTask) {
        tasksToSend.push(soughtTask);

        if (soughtTask.subTasks) {
          let children = [...soughtTask.subTasks];

          while (children.length>0) {
            let child = children.pop();
            let childTask = tasks.find((t)=>t._id == String(child));
            if (childTask) {
              tasksToSend.push(childTask);
              children.push(...childTask.subTasks)
            }    
          }
        }
      }
      res.render('taskView', {
        name: req.user.name,
        messages: req.session.messages,
        id: req.user.id,
        subs: req.session.subs,
        supes: req.session.supes,
        tasks: tasksToSend,
        known_associates: req.session.known_associates,
        unreadNotifications: Boolean(req.user.unreadNotifications),
        filters: req.user.filters,
        active_filter: {}
      })
    }
  })
})


router.get('/filterView', ensureAuthenticated, refreshLocals, function(req, res){
  let filterID = req.query.filterID;
  Task.find({$or: [{assignedBy: req.user._id}, {assignedTo: req.user._id}]}, function(err, tasks) {
    if (err) console.log(err);
    else {
      let filterObj = req.user.filters.find((f)=>f.id==filterID);
      if (!filterObj) filterObj = {};

      res.render('taskView',  {
        name: req.user.name,
        messages: req.session.messages,
        id: req.user.id,
        subs: req.session.subs,
        supes: req.session.supes,
        tasks: tasks,
        known_associates: req.session.known_associates,
        unreadNotifications: Boolean(req.user.unreadNotifications),
        filters: req.user.filters,
        active_filter: filterObj
      })
    }
  })

})


router.get('/people', ensureAuthenticated, refreshLocals, function(req, res){
  res.render('../views/people', {
    name: req.user.name,
    messages: req.session.messages,
    known_associates: req.session.known_associates,
    id: req.user.id,
    unreadNotifications: Boolean(req.user.unreadNotifications)
  })
})


router.get('/getSupes', ensureAuthenticated, refreshLocals, function(req, res){
  let supes = req.user.supes.filter(function(id){
    if (req.user.subs.includes(id)) return false;
    else return true;
  })

  if (supes.length == 0) res.send([]);
  let output = [];

  for (let supe of supes) {
    User.findById(supe, function(err, foundUser){
      if (err) output.push({
        username: err,
        email: err
      });
      else if (foundUser==null) output.push(null);
      else output.push({
        username: foundUser.name,
        email: foundUser.email
      })
      if (output.length == supes.length) {
        res.send(output);
      }
    });
  }
})

router.get('/getSubs', ensureAuthenticated, refreshLocals, function(req, res){
  let subs = req.user.subs.filter(function(id){
    if (req.user.supes.includes(id)) return false;
    else return true;
  })

  if (subs.length == 0) res.send([]);
  let output = []; 

  for (let sub of subs) {
    User.findById(sub, function(err, foundUser){
      if (err) output.push({
        username: err,
        email: err
      });
      else if (foundUser==null) output.push(null);
      else output.push({
        username: foundUser.name,
        email: foundUser.email
      })
      if (output.length == subs.length) {
        res.send(output);
      }
    });
  }
})

router.get('/getCollabs', ensureAuthenticated, refreshLocals, function(req,res){

  let collabs = req.user.subs.filter(function(id){
    if (req.user.supes.includes(id)) return true;
    else return false;
  })

  if (collabs.length == 0) res.send([]);
  let output = [];

  for (let collab of collabs) {
    User.findById(collab, function(err, foundUser){
      if (err) output.push({
        username: err,
        email: err
      });
      else if (foundUser==null) output.push(null);
      else output.push({
        username: foundUser.name,
        email: foundUser.email
      })
      if (output.length == collabs.length) {
        res.send(output);
      }
    });
  }
})

router.get('/notifications', ensureAuthenticated, function(req, res){

  Notification.find({$or: [{from:req.user._id}, {to:req.user._id}]}, function(err, data){
    if (err) res.send(err);
    else {
      res.render('../views/notifications', {
        name: req.user.name,
        messages: req.session.messages,
        id: req.user.id,
        subs: req.session.subs,
        supes: req.session.supes,
        known_associates: req.session.known_associates,
        notifications: data,
        unreadNotifications: Boolean(req.user.unreadNotifications)
      })
    }
  })

  
})

router.get('/register', function(req, res) {
  res.render('../views/register');
});

router.post('/register',
 function(req, res){
  let { name, email, password, confirm_password } = req.body;
  let error_msgs = [];

  if (name.length==0) error_msgs.push("Please enter at least one character for your name.");
  if (email.match(/^\w+[\w\.]+@\w+\.\w+/) == null) error_msgs.push("Please enter a valid email address.");
  if (password != confirm_password) error_msgs.push("Please make sure your passwords match.");

  if (error_msgs.length > 0) {
    res.render('../views/register', {messages:error_msgs});
  } else {
    let newUser = new User({
      name,
      email,
      password,
      confirmed: false,
      createTime: new Date(),
    });
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if (err) throw err;
        newUser.password = hash;
        newUser.save()
        .then(function(err) {
          let hash_id = bcrypt.hashSync(String(newUser._id), salt);
          hash_id = hash_id.replace(/\./g, '_').replace(/\//g, '-');
          newUser.confirmLink = hash_id;
          newUser.save();

          // Send email for confirmation
          var transport = nodemailer.createTransport({
            service: 'outlook',
            auth: {
              user: 'connorwales@gmail.com',
              pass: process.env.Email_Password
            },
            tls: {
              rejectUnauthorized: false,
            }
          })

          var mailOptions = {
            from: 'connorwales@gmail.com',
            to: email,
            subject: 'Confirm your ToDo Account',
            html: pug.renderFile('./views/welcomeEmail.pug', {
              name: name,
              link: "https://" + req.get('host') + "/users/login/" + hash_id
            })
          }

          transport.sendMail(mailOptions, function(err, info){
            if (err) console.log(err);
          })
        });
      })
    });

    // Redirect to home page
    req.session.messages = ["Thank you! We're sending you an email to confirm your account!"];
    res.redirect('/');
  }

  res.end();
});



module.exports = router;