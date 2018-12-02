const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('./config/config'); // get db config file
const User = require('./models/User'); // get the mongoose model
const port = process.env.PORT || 8080;
var jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// log to console
app.use(morgan('dev'));

app.use(passport.initialize());
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromHeader();
opts.secretOrKey = config.secret;
opts.issuer = 'accounts.examplesoft.com';
opts.audience = 'yoursite.net';
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));


app.get('/', (req, res) => {
    res.send('Hello')
});

app.post('/singup', (req, res) => {
    if (!req.body.name || !req.body.password) {
        res.json({ success: false, msg: 'Pass name and password!' });
    } else {
        let newUser = new User({
            name: req.body.name,
            password: req.body.password
        });
        console.log(newUser)
        newUser.save(err => {
            if (err) {
                console.log(err)
                return res.json({ success: false, msg: 'Username already exists' });
            }
            res.json({ success: true, msg: 'Successful created new user' });
        })
    }
});

app.post('/authenticate', (req, res) => {
    User.findOne({ name: req.body.name}, (err, user) => {
        console.log(user)
        if (err) throw err;
        if (!user) {
            res.send({ success: false, msg: 'Authentication failed. User not found.' });
        } else {
            user.comparePassword(req.body.password, (err, isMatch) => {
                if (isMatch && !err) {
                    let token = jwt.encode(user, config.secret);
                    res.json({ success: true, token: 'JWT ' + token });
                } else {
                    res.send({success: false, msg: 'Authentication failed. Wrong password.'});
                  }
            })
        }
    });
});
 
app.get('/memberinfo', passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log('g,swaf')
    var token = getToken(req.headers);
    if (token) {
      let decoded = jwt.decode(token, config.secret);
      User.findOne({
        name: decoded.name
      }, function(err, user) {
          if (err) throw err;
   
          if (!user) {
            return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
          } else {
            res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
          }
      });
    } else {
      return res.status(403).send({success: false, msg: 'No token provided.'});
    }
    res.send('WOW');
  });
   
  getToken = function (headers) {
    if (headers && headers.authorization) {
      var parted = headers.authorization.split(' ');
      if (parted.length === 2) {
        return parted[1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

app.listen(port, () => {
    console.log('Server is listening on ' + port);
});