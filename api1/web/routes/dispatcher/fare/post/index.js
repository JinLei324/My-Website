/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const calculateFare = require('./post');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @namespace */
const calculateFareCommon = require('../../../../commonModels/fare/post/postNew');
/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-FARE-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/dispatcher/fare',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Check if lat longs are inside zone',
            notes: 'Check if lat longs are inside operational zone',
            auth: 'managerJWT',
            validate: {
                /** @memberof calculateFare */
                payload: calculateFare.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                // status: {
                //     200: {
                //         message: Joi.any().default(i18n.__('fare')['200']), data: Joi.any()
                //     },
                //     400: { message: Joi.any().default(i18n.__('checkOperationZone')['400']), data: Joi.any() },
                //     404: { message: Joi.any().default(i18n.__('stores')['404']) },
                //     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                // }
            }
        },
        /** @memberof calculateFare */
        handler: calculateFareCommon.handler
    },


]