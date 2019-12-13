const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new LocalStrategy(function(username, password, done){
    User.findOne({email: username}, function(err, user){
      if (err) return done(err);
      if (!user) {
        return done(null, false, {message: "Incorrect email address"})
      } else {
        bcrypt.compare(password, user.password, function(err, isMatch){
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, {message: "Incorrect password"});
          }
        })
      }
    })
  }));
  

  passport.serializeUser(function(user, done){
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user) {
      return done(err, user);
    })
  })

}