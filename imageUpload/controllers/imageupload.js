
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    moment = require('moment'),
    config = require('../config.json'),
    http = require('http'),
    path = require('path'),
    os = require('os');
const fs = require('fs');
var AWS = require('aws-sdk');
AWS.config = require('../aws-config.json');
var Jimp = require("jimp");
const mediaDirectory = config.MEDIA_PATH;

var s3 = new AWS.S3();

exports.s3upload11 = function (req, res) {

    if (!req.files) return res.status(422).send({ code: 422, message: 'No file selected' });

    let sampleFile = req.files.sampleFile;
    let name = moment().valueOf() + '_' + sampleFile.name;
    // let name = moment().valueOf() + '_' + parseInt(Math.floor(Math.random() * 999)) + '.jpg';
    let path = mediaDirectory + '/' + name;
    let thumbnailName = mediaDirectory + '/' + 'thumb_' + name;
    let mobileName = mediaDirectory + '/' + 'mobile_' + name;
    console.log(sampleFile.mimetype);
    sampleFile.mv(mediaDirectory + '/' + name, function (err) {
        if (err) {
            return res.status(500).send(err);
        } else {
            async.series([
                function (cb) {
                    thumbnail(path, thumbnailName, (e, d) => {
                        uploadImage(sampleFile, config.bicketName, 'thumb_' + name, thumbnailName, (err, data) => {
                            if (err) {
                                // fs.unlink(path, (err, res) => { });
                                return cb(err);
                            } else {
                                console.log('upload success:', data);
                                return cb(null, data);
                            }
                        });
                    });
                },
                function (cb) {
                    mobile(path, mobileName, (e, d) => {
                        uploadImage(sampleFile, config.bicketName, 'mobile_' + name, mobileName, (err, data) => {
                            if (err) {
                                // fs.unlink(path, (err, res) => { });
                                return cb(err);
                            } else {
                                console.log('upload success:', data);
                                return cb(null, data);
                            }
                        });
                    })
                },
                function (cb) {
                    uploadImage(sampleFile, config.bicketName, name, path, (err, data) => {
                        if (err) {
                            // fs.unlink(path, (err, res) => { });
                            return cb(err);
                        } else {
                            console.log('upload success:', data);
                            return cb(null, data);
                        }
                    });
                }
            ], (err, result) => {
                if (err) return res.status(500).send(err);
                else return res.send({ code: 200, message: 'success', data: result });
            });
        }
    });
}


function uploadImage(sampleFile, bucket, destFile, sourceFile, cb) {
    // Read in the file, convert it to base64, store to S3
    fs.readFile(sourceFile, function (err, data) {
        if (err) { 
            fs.unlink(sourceFile, (err, res) => { });
            console.log(err);
            return cb(err); 
        }
        var base64data = new Buffer(data, 'binary');
        var later = moment().unix() + 864000;
	s3.putObject({
            Bucket: bucket,
            Key: destFile,
            Body: base64data,
            ACL: 'public-read',
            Metadata:{"Cache-Control" : "max-age=864000", "Expires" : later.toString()},
            ContentType:"image/jpeg"
        }, function (resp) {
            fs.unlink(sourceFile, (err, res) => { });
            let data = {
                "type": "result",
                "id": moment().valueOf(),
                "path": destFile
            }
            return cb(null, data);
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
            lenna.resize(Jimp.AUTO, 960)            // resize 
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
        lenna.resize(Jimp.AUTO, 256)            // resize 
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


