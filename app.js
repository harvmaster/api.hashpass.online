import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import User from './models/user';
var passport = require('passport');
var session = require('express-session');
var cors = require('cors');


const app = express();

console.log("starting up");
    /*
    * Connect to the database
    */

const db = mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_ENDPOINT}`).then( () => {
  console.log("Connected to Database");
});

    /**
    * Middleware
    */
app.use(session({ secret: process.env.SERVER_SECRET, cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// catch 400
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(400).send(`Error: ${res.originUrl} not found`);
    next();
});

// catch 500
app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send(`Error: ${err}`);
    next();
});

/**
    * Register the routes
*/
require('./config/passport');

app.use(cors())
app.get('/api', cors(), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for a Single Route'})
})

app.use(require('./routes'));

export default app;
