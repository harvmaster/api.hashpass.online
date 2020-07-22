const mongoose = require('mongoose');

// Database information required
var fileSchema = mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bucket: {
        type: String,
        default: 'icons'
    },
    create_date:{
        type: Date,
        default: Date.now
    }
});

fileSchema.methods.getfile = function () {
    return {
        name: this.name,
        url: this.url,
        uploadedBy: this.uploadedBy,
        type: this.type,
        create_date: this.create_date
    };
};

// Access outside of the file
var File = module.exports = mongoose.model('File', fileSchema);

// Find all Files
module.exports.getfiles = function(callback, limit) {
    File.find(callback).limit(limit);
}
