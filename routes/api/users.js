var mongoose = require('mongoose');
var router = require('express').Router();
var jwt = require('express-jwt');
var passport = require('passport');
var User = require('../../models/user');
var Service = require('../../models/service');
var auth = require('../auth');

// Returns the user and their services
router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then( async function(user){
    if(!user){ return res.sendStatus(401); }
    const services = await Service.find({user: user.id})
    let compiled = [];
    for (let service of services) {
      compiled.push(await service.getService());
    }

    return res.json({user: user.toAuthJSON(), services: compiled});
  }).catch(next);
});

// Deletes a user
router.delete('/users/delete/:id', auth.required, function(req, res, next){
    console.log(`${req.user.username} (${req.user.id} has deleted their account) `);
    User.findByIdAndRemove(req.user.id, () => {
      Service.deleteMany({user: req.user.id}, () => {;
        res.json({status: "successful"});
      });
    });

});

// Authenticate user and return a JSON Web Token
router.post('/users/login', function(req, res, next){
    let errors = []
  if(!req.body.user.username){
    errors.push("Username can't be blank");
  }

  if(!req.body.user.password){
    errors.push("Password can't be blank");
  }

  if (errors.length) return res.status(422).json({errors: errors});

  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

// Create a new user
router.post('/users/create', async function(req, res, next){
    var user = new User();

    if (!req.body.user.username) return res.status(422).json({errors: {username: "Username can't be blank"}});
    if (!req.body.user.password) return res.status(422).json({errors: {password: "Password can't be blank"}});
    const isUnique = await User.find({username: req.body.user.username});
    console.log(isUnique);
    if (isUnique.length) return res.status(409).json({errors: ["That username is already taken"]});

    user.username = req.body.user.username;
    user.setPassword(req.body.user.password);

    user.save().then(function(){
        console.log(`created user: ${user.username}`)
        return res.json({user: user.toAuthJSON()});
    }).catch(next);
});

module.exports = router;
