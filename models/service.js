const mongoose = require('mongoose');
var secret = require('../config').secret;
var aws = require('aws-sdk')
var minio = require('minio');

var s3 = new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_ENPOINT_PORT,
    useSSL: false,
    accessKey: process.env.MINIO_USERNAME,
    secretKey: process.env.MINIO_PASSWORD
});

// Database information required
var serviceSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    logo: {
      type: String,
      required: false
    },
    note: {
      type: String,
      required: false
    },
    legacy: {
        type: Boolean,
        default: false
    },
    create_date:{
        type: Date,
        default: Date.now
    }
});

// Called when returning a service to the user. Formats the json and makes sure only neccessary information is returned from the database
serviceSchema.methods.getService = async function(user) {
    return await this.refreshLogo().then( logo => {
        return {
            id: this.id,
            name: this.name,
            user: this.user,
            note: this.note,
            legacy: this.legacy,
            logo: logo,
            create_date: this.create_date
        }
    })
};

// Give out a url for the service's icon that will last for 1 week
serviceSchema.methods.refreshLogo = function () {
    return new Promise ((resolve, reject) => {
        if (this.logo.split('/').length > 2) return resolve(this.logo)
        
        s3.presignedGetObject('icons', this.logo, 24*60*60*7, (err, presignedUrl) => {
            if (err) reject(err)
            resolve(presignedUrl)
        })
    })
}

//Access outside of the file
var Service = module.exports = mongoose.model('Service', serviceSchema);
//Return all of the users in the database
module.exports.getServices = function(callback, limit) {
    return Service.find(callback).limit(limit);
}
