/** @global */
const Joi = require('joi')
/** @namespace */
const getPickupSlots = require('./get');

/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
   
    {
        method: 'GET',
        path: '/slots/pickup/{zoneId}',
        config: {
            tags: ['api', 'laundry'],
            description: 'This api is used to get all pickup slots  which belongs to nearest zone.',
            notes: 'This api is used to get all pickup slots  which belongs to nearest zone.',
            auth:  {
                strategies: ['guestJWT', 'customerJWT']
            },
            validate: {
                
                params: getPickupSlots.validator,
               
                headers: headerValidator.headerAuthValidator,
                
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('store')['200']),data: Joi.any()
                    },
                    400: { message: Joi.any().default(i18n.__('store')['400']) },
                    404: { message: Joi.any().default(i18n.__('store')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        /** @memberof manager */
        handler: getPickupSlots.handler,
    }
]