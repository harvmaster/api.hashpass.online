const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

// Database information required
var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    },
    create_date:{
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(uniqueValidator, {message: 'is already taken.'});
// Check if the entered password matches on login
userSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.password === hash;
};
// Create a salt to hash the entered password and save it to the user 
userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};
// Create the JSON Web Token to keep the user logged in and allow them to make api requests
userSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 1);

  return jwt.sign({
    id: this._id,
    name: this.name,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
};
// Called once authenticated. Converts the data that is in the database to a more readable format and ensures on necessary information is returned
userSchema.methods.toAuthJSON = function(user) {
    return {
        id: this.id,
        username: this.username,
        token: this.generateJWT()
    }
};

//Access outside of the file
var User = module.exports = mongoose.model('User', userSchema);
//Return all of the users in the database
module.exports.getUsers = function(callback, limit) {
    return User.find(callback).limit(limit);
}
