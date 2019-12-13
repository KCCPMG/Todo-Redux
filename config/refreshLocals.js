const Task = require('../models/Task.js');
const User = require('../models/User.js');
const mongoose = require('mongoose');

module.exports = function(req, res, next) {

  let sub_output = [];
  let supe_output = [];
  let tasks_assigned = [];
  let user_tasks = [];
  let promises = [];
  let user = req.user;

  // get subs to send to session
  for (let sub of user.subs) {
    promises.push(User.findById(sub, function(err, subUser){
      if (err) sub_output.push({
        id: sub,
        name: err,
        email: err
      });
      else sub_output.push({
        id: sub,
        name: subUser.name,
        email: subUser.email
      })
    }))
  }

  // get supes to send to session
  for (let supe of req.user.supes) {
    promises.push(User.findById(supe, function(err, supeUser){
      if (err) supe_output.push({
        id: err,
        name: err,
        email: err
      });
      else supe_output.push({
        id: supe,
        name: supeUser.name,
        email: supeUser.email
      })
    }))
  }

  // get tasks assigned by user to send to session
  promises.push(Task.find({assignedBy: req.user._id}, function(err, data){
    if (err) console.log(err);
    else tasks_assigned = data;
  }))

  // get tasks assigned to user to send to sesion
  promises.push(Task.find({assignedTo: req.user._id}, function(err, data){
    if (err) console.log(err);
    else user_tasks = data;
  }))


  Promise.all(promises).then(function(){
    req.session.subs = sub_output;
    req.session.supes = supe_output;
    req.session.known_associates = [{
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }]
    sub_output.forEach(function(sub) {
      if (!Boolean(req.session.known_associates.find(function(el){
        return el.id == sub.id
      }))) {
        req.session.known_associates.push(sub);
      }
    })
    supe_output.forEach(function(supe) {
      if (!Boolean(req.session.known_associates.find(function(el){
        return el.id == supe.id
      }))) {
        req.session.known_associates.push(supe);
      }        
    })

    req.session.tasks_assigned = tasks_assigned;
    req.session.user_tasks = user_tasks;
    next();
  })

}