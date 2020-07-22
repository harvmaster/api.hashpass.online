var mongoose = require('mongoose');
var router = require('express').Router();
var multer = require('multer')
var multerS3 = require('multer-s3')
var aws = require('aws-sdk')
var auth = require('../auth');
var minio = require('minio');
var File = require('../../models/file');
var crypto = require('crypto');
const hash = crypto.createHash('sha256');
var Service = require('../../models/service');

// Define the storage server
var s3 = new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_ENPOINT_PORT,
    useSSL: false,
    accessKey: process.env.MINIO_USERNAME,
    secretKey: process.env.MINIO_PASSWORD
});

async function saveFiles(files, bucket = "icons", user) {
    if (!files) return;
    let set = "undefined"
    
    try {
        hash.update(files[0].url);
        set = hash.digest('hex');
    } catch (exception) {
        console.log(exception);
    }
    
    let errors = [];
    files.forEach(file => {
        let model = new File();
        
        model.name = file.fileName;
        model.url = file.url;
        model.uploadedBy = user;
        model.type = bucket;
        model.bucket = bucket;
        
        try {
            model.save( err => {
              if (err) {
                  errors.push({file, error: err})
              } else {
                  return true;
              }
            });
        } catch (exception) {
            console.log(exception);
            errors.push({file, error: exception})
        }
    
    });
    if (errors.length > 0) console.log("Errors: ", errors);
    return errors.length < 1;
}

router.post('/', auth.required, multer({dest: "./uploads/"}).array("file", 16), async function(request, response) {
    const files = request.files;
    const bucket = request.body.type;
    const service = request.body.service
    const user = await auth.getUser(request, response);
    if (response.headersSent) return;
    console.log("Uploading: ", files);
    let res = [];
    files.forEach((file, fileId, fileList) => {
        let fileName =  file.originalname + Date.now()
        s3.fPutObject(bucket, fileName, file.path, (error, etag) => {
            if(error) {
                return console.log(error);
            }
            s3.presignedGetObject(bucket, fileName, 7*24*60*60, async (err, presignedUrl) => {
                if (err) return console.log(err)
                res.push({url:presignedUrl, fileName: fileName});
                if (fileId === fileList.length - 1) {
                    const saved = await saveFiles(res, bucket, user._id);
                    if (saved) {
                        let serviceObj = await Service.findById(service);
                        serviceObj.logo = res[0].fileName;
                        await serviceObj.save()
                        response.send(await serviceObj.getService());
                        
                    }
                    else response.status(500).json({error: "Internal Server error"});
                }
            })
        });
    });
});


module.exports = router;
