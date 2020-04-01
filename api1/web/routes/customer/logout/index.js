/** @global */
const Joi = require('joi') 
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales'); 
/** @namespace */
const logout = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-LOGOUT-API-ROUTES 
*/
module.exports = [
      /**
   * api to customer logout
   */
    {
        method: 'PATCH', // Methods Type
        path: '/customer/logout', // Url

        config: {// "tags" enable swagger to document API 
            tags: ['api', 'customer'],
            description: 'This API is used to logout the customer.',
            notes: "This API is used to logout the customer.", // We use Joi plugin to validate request 
            auth: 'customerJWT',
            // validate: {
                /** @memberof headerValidator */
                // headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                // failAction: headerValidator.customError
            // },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('supportLogOut')['200'])
                    },
                    498: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['498'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: logout.handler
    }
]