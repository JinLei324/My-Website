'use strict'
const support = require('../../../../../models/support');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const driverSpecialities = require('../../../../../models/driverSpecialities');
const cities = require('../../../../../models/cities');
const _ = require('underscore-node');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    const read = () => {
        return new Promise((resolve, reject) => {
            support.get({ usertype: "2" }, (err, support) => {
                if (err) {
                    reject(err);
                }
                resolve(support);
            });

        });
    }

    read().then(supportTxtResp => {
        if (supportTxtResp.length > 0) {
            let supportTxt = [];
            async.forEach(supportTxtResp, (itemCat, callbackloop1st) => {
                let sp = [];
                if (itemCat.has_scat && itemCat.has_scat == true) {
                    async.forEach(itemCat.sub_cat, (item, callbackloop) => {
                        sp.push({ 'name': item.name[request.headers.language], "desc": item.desc[request.headers.language], 'link': config.driverSupportUrl + "getsubDescription/" + itemCat.cat_id + "/" + item.id.toString() + "/" + request.headers.language });
                        callbackloop(null);
                    }, function (loopErr) {

                    });
                }
                supportTxt[itemCat.cat_id] = { 'name': itemCat.name[request.headers.language] || '', 'subcat': sp, 'desc': typeof itemCat.desc != "undefined" ? itemCat.desc[request.headers.language] : '', 'link': typeof itemCat.desc != "undefined" ? (config.driverSupportUrl + "getDescription/" + itemCat.cat_id + "/" + request.headers.language) : '' };
                callbackloop1st(null);
            }, function (loopErr) {
                // return reply({
                //     message: error['supportReview']['200'], data: _.without(supportTxt, null)
                // }).code(200);
                return reply({ message: request.i18n.__('supportReview')['200'], data: _.without(supportTxt, null) }).code(200);
            });
        } else {
            // return reply({
            //     message: error['supportReview']['404']
            // }).code(404);
            return reply({ message: request.i18n.__('supportReview')['404'] }).code(404);
        }
    }).catch(e => {
        logger.error('err during get support driver (get) ' + JSON.stringify(e));
        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
    });

}



/**
* A module that exports get zone Handler, Otp validator! 
* @exports handler 
*/
module.exports = { handler }