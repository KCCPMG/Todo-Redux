const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');

const User = require('../models/User');
const Task = require('../models/Task');


router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info){
    if (err) return next(err);
    if (!user) {
      return res.redirect('/');
    } if (user.confirmed == false) {
      req.session.messages = ["Please confirm your account before logging in"];
      return res.redirect('/');
    }
    req.logIn(user, function(err){
      if (err) return next(err);
      req.session.messages = ["Welcome back, " + req.user.name + "!"];

      return res.redirect('/dashboard');
    })
  })(req, res, next)
});


router.get('/logout', function(req, res){
  req.logout();
  req.session.messages = ['You have successfully logged out'];
  res.redirect('/');
})


router.get('/login/:confirmLink', function(req, res) {
  let confirmLink = req.url.slice(7) 
  User.findOne({confirmLink: confirmLink}, function(err, user){
    if (err) console.log(err);
    if (user == null) res.render('../views/index', {messages: ['Invalid link']});
    else {
      req.session.messages = ['Please log in to confirm your account']
      res.render('../views/index', {
        link: confirmLink
      });
    }
  })
})


router.post('/login/:confirmLink', function(req, res, next) {
  let confirmLink = req.url.slice(7); 
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);  
    if (!user) {
      req.session.messages = ["Please double-check your email address"]
      return res.redirect('/login/'+confirmLink);
    } if (user.confirmLink != confirmLink) {
      req.session.messages = ["Are you sure you're using the right link?"]
      return res.redirect('/login'+confirmLink);
    }
    req.logIn(user, function(err){
      if (err) return next(err);
      req.session.messages = ["Thanks for confirming, " + user.name + ", you're all set!"];
      user.confirmed = true;
      user.save();
      return res.redirect('/dashboard');
    })
  })(req, res, next); 
})


router.get('/:userID', ensureAuthenticated, function(req, res){
  let id = req.params.userID;
  User.findById(id, function(err, user){
    if (err) console.log(err);
    if (user == null) res.send("");
    else {
      let foundUser = {
        id,
        email: user.email,
        name: user.name
      }
      req.session.known_associates.push(foundUser)
      res.send(foundUser);
    }
  })
})


module.exports = router;