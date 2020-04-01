/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const searchByName = require('../../../../commonModels/search/customer/get.js');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @exports DISPATCHER-CUSTOMER-SEARCH-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/search/{data}/{needle}/{storeId}',
        config: {
            cors: true,
            tags: ['api', 'dispatcher'],
            description: 'Search customers based on data',
            notes: 'Search customers based on data API.',
            auth: 'managerJWT',
            validate: {
                /** @memberof searchByName */
                params: searchByName.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('stores')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('stores')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof searchByName */
        handler: searchByName.handler
    },
    {
        method: 'GET',
        path: '/dispatcher/customSearch/{needle}/{storeId}',
        config: {
            cors: true,
            tags: ['api', 'dispatcher'],
            description: 'Search customers based on data',
            notes: 'Search customers based on data API.',
            auth: 'managerJWT',
            validate: {
                /** @memberof searchByName */
                params: searchByName.customValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('stores')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('stores')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    404: { message: Joi.any().default(i18n.__('customer')['404']) }
                }
            }
        },
        /** @memberof searchByName */
        handler: searchByName.customHandler
    }

     
]