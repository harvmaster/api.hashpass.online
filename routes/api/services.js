var mongoose = require('mongoose');
var Service = require('../../models/service');
var User = require('../../models/user');
var router = require('express').Router();
var auth = require('../auth');
var axios = require('axios');

async function refactorLogos() {
  const services = await Service.find();
  for(let service of services) {
    console.log(service.name);
    let res = await axios.get('https://autocomplete.clearbit.com/v1/companies/suggest?query='+service.name);
    let logo = ''
    console.log(res.data);
    if (res.data.length > 0) logo = res.data[0].logo;
    if (!service.logo) {
      console.log(logo)
      service.logo = logo;
      service.save();
      console.log("Updated logo for " + service.name);
    }


  }
  console.log("Done updating logos")
}

// Call clearbit's autocomplete api to get the logo for the website
async function getLogo(service) {
  const res = await axios.get('https://autocomplete.clearbit.com/v1/companies/suggest?query='+service);
  return res.data[0].logo;
}

// Parameter that can be in the url
router.param('service', async function(req, res, next) {
    req.service = req.params.service
    return next();
});

// Parameter that can be in the url
router.param('user', async function(req, res, next) {
    const id = req.params.user;
    const user = await User.findById(id);
    if (!user) return res.status(204);
    req.user = user;
    return next();
})

// Returns all of the services for the user
router.get('/:user', auth.required, async function(req, res, next) {
    const services = await Service.find({user: req.user.id});
    return res.status(200).json({user: req.user.id, services: services});
})

// Deletes the service for the user
router.delete('/:user/:service', auth.required, async function(req, res) {
    Service.findOneAndRemove({user: req.user.id, name: req.service}, () => {
        res.json({status: "successful"});
    });
});

// Updates the field in the database for a single service
router.put('/:user/:service', auth.required, async function(req, res, next) {
    let update = { legacy: req.body.legacy };
    const service = await Service.findOneAndUpdate({user: req.user.id, name: req.service}, update)
    console.log(service);
    res.json("Successfully Updated").status(200);
});

// Creates the service for the user
router.post('/create', auth.required, async function(req, res, next){
    let service = new Service();
    let user = await auth.getUser(req, res);

    if (!req.body.service) return res.status(422).json({errors: {service: "Service can't be blank"}});
    if (!user) return res.status(422).json({errors: {user: "You must be logged in to save a service"}});
    const isUnique = await Service.findOne({user: user, name: req.body.service});
    if (isUnique) return res.status(204).json({errors: {service: "That service already exists"}});

    service.name = req.body.service;
    service.user = user;
    service.legacy = req.body.legacy;
    service.logo = await getLogo(req.body.service);

    service.save().then(async () => {
      console.log(`${service.user} created a service`)
      return res.json({service: await service.getService()})
    })

});

module.exports = router;

