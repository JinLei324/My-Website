const orderType = require('../../../../../../models/orderTypes');
const mobileDevices = require('../../../../../../models/mobileDevices');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../statusMessages/responseMessage'); // response messages based on language 
const status = require('../../../../../../statusMessages/statusMessages');
const moment = require('moment'); //date-time
const config = process.env;
var Joi = require('joi');
const logger = require('winston');
const async = require("async");
/** 
 * @function
 * @name handler
 * @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
 * @return {object} Reply to the user.
 */

var handler = (request, reply) => {
    orderType.getAll({"type": request.params.itemType}, (err, orderTypesData) => {


        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }

        var orderTypes = [];

        async.forEach(orderTypesData, (orderTypesResponse, callBackLoop) => {

            
            orderTypes.push({
                "id": orderTypesResponse._id.toString(),
                "name": orderTypesResponse.name[request.headers.language],
                "description": orderTypesResponse.description[request.headers.language],
                "seqId": orderTypesResponse.seqId,
                "bannerImage": orderTypesResponse.country
            });
            return callBackLoop(null);
        }, (loopErr) => {
            return reply({
                message: request.i18n.__('getData')['200'],
                data: orderTypes
            }).code(200);
        })
       

    });
}

const validator = {
    itemType: Joi.number().required().description('Mandatory field. 1 for grocery and 2 for non grocery').error(new Error('addressId must be a 24 number')),
}

// export handler and validator
module.exports = {
    handler,
    validator
}