'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator'); 
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');
/** @namespace */
const logout = require('./post');

module.exports =    /**
* api to customer logout
*/
   {
       method: 'PATCH', // Methods Type
       path: '/driver/logout', // Url

       config: {// "tags" enable swagger to document API 
           tags: ['api', 'driver'],
           description: 'This API is used to logout the driver.',
           notes: "This API is used to logout the driver.", // We use Joi plugin to validate request 
           auth: 'driverJWT',
           validate: {
               /** @memberof headerValidator */
               headers: headerValidator.headerAuthValidatorDriver,
               /** @memberof headerValidator */
               failAction: headerValidator.customError
           },
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
