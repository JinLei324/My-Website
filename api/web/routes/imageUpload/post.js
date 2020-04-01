
'use strict';

const joi = require('joi');
const logger = require('winston');
const moment = require('moment');

var config = process.env;
const utils = require('./fileUploader');
// const config = require('../../../../configuration');

// const errorMsg = require('../../../../locales');

let ImagesBasePath = config.IMAGE_BASE_PATCH;
const IMAGE_BASE_URL = config.IMAGE_BASE_URL;

const payload = {
    maxBytes: 1000 * 1000 * 15, // 5 Mb
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
};//payload of upload image api

const payloadValidator = {
    image: joi.any().meta({ swaggerType: 'file' }).required().description('Images to upload').error((new Error('Image is missing'))),
    type: joi.any().description('Type of Image'),
    res: joi.any().description('array or object (only for signle image upload)')
}

/**
 * @function POST /utility/uploadImage
 * @description -New Image Upload
 * @param {*} req 
 * @param {*} reply 
 */

let handler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    const checkProvider = function () {
        return new Promise((resolve, reject) => {

            const data = req.payload;
            const file = data['image'];

            let filePath = ImagesBasePath;

            const fileOptions = { dest: `${filePath}/`, baseUrl: IMAGE_BASE_URL };//, extName:path.extname(file.hapi.filename.toString()) };

            utils.uploader(file, fileOptions)
                .then((result) => {
                    return resolve(result);
                }).catch((err) => {
                    console.log("err", err)
                    return reject({ message: req.i18n.__('postUploadImage')['412'], code: 412 })
                });
        });
    }

    checkProvider()
        .then(data => {
            if (!Array.isArray(data) && req.payload.res == 'array') {
                data = [data];
            }
            return reply({ message: req.i18n.__('postUploadImage')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("error while uploading image =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {

}//swagger response code



module.exports = {
    payload,
    payloadValidator,
    handler,
    responseCode
};