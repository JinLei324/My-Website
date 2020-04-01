/** @global */
const Joi = require('joi')
/** @namespace */
const getOrderTypes = require('./get');
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-ORDER-HISTORY-API-ROUTES  
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/itemType/{itemType}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Api to get the order types',
            notes: "Api to get the order types",
            auth: 'managerJWT',
            validate: {
                /** @memberof validator */
                // params: getById.validator,
                // params: get.validator,
                params: {
                    itemType: Joi.number().required().description('Mandatory field. 0 for grocery and 1 for non grocery').error(new Error('addressId must be a 24 number')),
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,

            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any() },
                    // 404: { message: Joi.any().default(i18n.__('getProfile']['404'] },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: getOrderTypes.handler
    }
];