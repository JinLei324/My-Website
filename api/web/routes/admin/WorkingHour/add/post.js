'use strict'


const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
var workingHour = require('../../../../../models/workingHour');
var workingHourUtil = require('../../../../commonModels/workingHour');
var workingHourElastic = require('../../../../../models/workingHourElastic');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    // let WorkingHourIds = [];
    let condition = { "_id": new ObjectID(request.payload._id) };
    workingHour.getById(condition, (err, result) => {
        if (result) {
            result.startDateISO = result.startDateISO.toISOString();
            result.endDateISO = result.endDateISO.toISOString();

            workingHourElastic.Insert(result, (err, resultelastic) => {
                if (err) {
                    logger.error('Error occurred WorkingHourElastic search (Insert): ' + JSON.stringify(err));
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                } else {
                    workingHourUtil.workingHourCheck(result.storeId, (err, res) => {
                        if(err){
                            logger.error('Store Working Hours Event Redis error :', err);
                        } else {
                            logger.info('Store Working Hours Event result : ', res);
                        }
                    });
                   
                    return reply({
                        message: request.i18n.__('getData')['200'],
                        data: {}
                    }).code(200)
                }
            });
        } else {
            return reply({ message: request.i18n.__('getData')['404'] }).code(404);
        }
    });
};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    _id: Joi.string().required().description('WorkingHour Id'),
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }