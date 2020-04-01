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
    workingHour.getById({ "_id": new ObjectID(request.params.workingHourId.toString()) }, (err, result) => {
        if (result) {
            workingHourElastic.Update(request.params.workingHourId.toString(), { status: 3, statusMsg: 'Deleted' }, (err, resultelastic) => {
                if (err) {
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] });
                }
                workingHourUtil.workingHourCheck(result.storeId, (err, res) => {
                    if (err) {
                        logger.error('Store Working Hours Event Redis error :', err);
                    } else {
                        logger.info('Store Working Hours Event result : ', res);
                    }
                });
                return reply({ message: request.i18n.__('getData')['200'], data: resultelastic });
            })

        }
    })
}

const validator = {
    workingHourId: Joi.string().description('working hour id')
}

module.exports = { handler, validator }
