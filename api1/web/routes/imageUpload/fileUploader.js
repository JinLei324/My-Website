'use strict'

const fs = require('fs');
const moment = require('moment');
const mkdirp = require('mkdirp');
const path1 = require('path');

var Jimp = require("jimp");

var config = process.env;
const aws = require('aws-sdk');

aws.config.update({
    secretAccessKey: config.AMAZON_AWS_AUTH_SECRET,
    accessKeyId: config.AMAZON_AWS_ACCESS_KEY,
    region: config.region
});
const bucketName = config.AMAZON_S3_BUCKET_NAME;

const s3 = new aws.S3({
    apiVersion: '2008-10-17',
    params: { Bucket: bucketName }
});

let ImagesBasePath = config.IMAGE_BASE_PATCH;

let s3mobileImage = "";
let s3thumnailImage = "";
let s3OriginalImage = "";

const uploader = function (file, options) {
    return new Promise((resolve, reject) => {
        if (!file)
            return reject('no file');

        if (Array.isArray(file)) {
            _filesHandler(file, options)
                .then((data) => {
                    return resolve(data);
                }).catch((err) => {
                    return reject(err);
                });
        } else {
            _fileHandler(file, options)
                .then((data) => {
                    return resolve(data);
                }).catch((err) => {
                    return reject(err);
                });
        }
    })
}

const _fileHandler = function (file, options) {
    return new Promise((resolve, reject) => {
        if (!file)
            return reject('no file');

        if (options.fileFilter && !options.fileFilter(file.hapi.filename)) {
            return reject('type not allowed');
        }

        mkdirp.sync(ImagesBasePath, {});//create a directory if it does not exists

        const originalName = file.hapi.filename.toString();
        const fileName = 'IMG-' + moment().unix() + "-" + parseInt(Math.floor(Math.random() * 999)) + path1.extname(originalName);//path.extname(originalName);
        const filePath = `${ImagesBasePath}${fileName}`;

        let name = fileName;
        // let name = moment().valueOf() + '_' + parseInt(Math.floor(Math.random() * 999)) + '.jpg';
        let path = ImagesBasePath + name;
        let thumbnailName = ImagesBasePath + 'thumb-' + name;
        let mobileName = ImagesBasePath + 'mobile-' + name;
        //create a directory if it does not exists
        const fileStream = fs.createWriteStream(filePath);
        const checkmobile = function () {
            return new Promise((resolve, reject) => {
                mobile(path, mobileName, (e, d) => {
                    uploadImage(file, 'images', 'mobile-' + name, mobileName, options, (err, data) => {
                        s3mobileImage = data;
                        return resolve(true);
                    });
                })
            });
        }
        const checkthumbnailName = function () {
            return new Promise((resolve, reject) => {
                thumbnail(path, thumbnailName, (e, d) => {
                    uploadImage(file, "images", 'thumb-' + name, thumbnailName, options, (err, data) => {
                        s3thumnailImage = data;
                        return resolve(true);
                    });
                });
            });
        }
        const uploadImageData = function () {
            return new Promise((resolve, reject) => {
                uploadImage(file, "images", name, path, options, (err, data) => {
                    s3OriginalImage = data;
                    return resolve(true);
                });
            });
        }
        const sveImageInLocal = function () {
            return new Promise((resolve, reject) => {
                file.on('error', function (err) {
                    return reject(err);
                });
                file.pipe(fileStream);
                file.on('end', function (err) {
                    if (err) {
                        return reject('problem while uploading image');
                    }
                    return resolve(true);
                })
            });
        }

        sveImageInLocal()
            .then(checkmobile)
            .then(checkthumbnailName)
            .then(uploadImageData)
            .then(data => {
                const fileDetails = {
                    // fieldname: file.hapi.name,
                    originalName,
                    fileName,
                    image: s3OriginalImage,
                    mobileImage: s3mobileImage,
                    thumbnailImage: s3thumnailImage,
                    mimetype: file.hapi.headers['content-type'],
                }
                return resolve(fileDetails);
            }).catch(e => {
                console.log("error while uploading image =>", e)
                return reply({ message: e.message }).code(e.code);
            });
    })
}

const _filesHandler = function (files, options) {
    return new Promise((resolve, reject) => {
        if (!files || !Array.isArray(files))
            return reject('no file');

        const promises = files.map(x => _fileHandler(x, options));
        Promise.all(promises)
            .then(function (fileDetails) {
                return resolve(fileDetails);
            }).catch(function (err) {
                return reject(err);
            });
    })
}

module.exports = { uploader };

function uploadImage(sampleFile, folderName, destFile, sourceFile, options, cb) {
    // Read in the file, convert it to base64, store to S3
    fs.readFile(sourceFile, function (err, data) {
        if (err) {
            fs.unlink(sourceFile, (err, res) => { });
            console.log(err);
            return cb(err);
        }
        var base64data = new Buffer(data, 'binary');
        var later = moment().unix() + 864000;
        var params = {
            Bucket: bucketName,
            Key: folderName + '/' + destFile,
            Body: base64data,
            ACL: 'public-read',
            Metadata: {
                "Cache-Control": "max-age=864000",
                "Expires": later.toString()
            },
            ContentType: "image/jpeg"
        };
        s3.putObject(params, function (err, data1) {
            fs.unlink(sourceFile, (err11, res11) => { });
            if (err) {
                console.log(err, err.stack);
                return cb(err.stack, "");
            } // an error occurred
            else {
                let s3FileName = options.baseUrl + destFile;
                return cb(null, s3FileName);
            }
        });
    });
}

/**
* function to generate thumbnail image of an image being uploaded
* @param {*} path
* @param {*} thumbnailName
                */
function thumbnail(path, thumbnailName, cb) {
    Jimp.read(path, function (err, lenna) {
        if (err) cb(err, null);
        else {
            lenna.resize(Jimp.AUTO, 100)            // resize 
                .quality(60)                 // set JPEG quality 
                .rgba(true)
                // .greyscale()                 // set greyscale 
                .write(thumbnailName, (err, res) => {
                    setTimeout(() => {
                        cb(null, true);
                    }, 2000)
                }); // save 
        }
    });
}

/**
 * function to generate mobile size of an image being uploaded
* @param {*} path
* @param {*} mobileName
    */
function mobile(path, mobileName, cb) {
    Jimp.read(path, function (err, lenna) {
        if (err) cb(err, null);
        lenna.resize(Jimp.AUTO, 300)            // resize
            .quality(60)                 // set JPEG quality
            .rgba(true)
            // .greyscale()                 // set greyscale
            .write(mobileName, (err, res) => {
                setTimeout(() => {
                    cb(null, true);
                }, 2000)
            }); // save
    });
}
