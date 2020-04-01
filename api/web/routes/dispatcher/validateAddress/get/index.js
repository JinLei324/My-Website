/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const validateAddress = require('./get');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-FARE-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/validateAddress/{dropLatitude}/{dropLongitude}/{pickUpLatitude}/{pickUpLongitude}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'This api validates the pick up address and the delivery address within zone',
            notes: 'This api validates the pick up address and the delivery address within zone',
            auth: 'managerJWT',
            validate: {
                /** @memberof calculateFare */
                params: validateAddress.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('fare')['200']), data: Joi.any()
                    },
                    400: { message: Joi.any().default(i18n.__('checkOperationZone')['400']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('stores')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof calculateFare */
        handler: validateAddress.handler
    },


]