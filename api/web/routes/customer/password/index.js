/** @global */
const Joi = require('joi') 
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const patchPassword = require('./patch');

/** @namespace */
const post = require('./post'); 
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-EMAIL-PHONE-VALIDATION-API-ROUTES 
*/
module.exports = [
      /**
   * api to update the password
   */
  {
    method: 'PATCH',
    path: '/customer/password',
    config: {
        tags: ['api', 'customer'],
        description: 'API to update the password.',
        notes: "This API to update the password.",
        auth: false,
        validate: {
            /** @memberof patchPassword */
            payload: patchPassword.validator,
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('customerUpdatePassword')['200']) },
                401: { message: Joi.any().default(i18n.__('customerUpdatePassword')['401']) },
                402: { message: Joi.any().default(i18n.__('customerUpdatePassword')['402']) },
                406: { message: Joi.any().default(i18n.__('supportVerifyOTP')['406']) },
                440: { message: Joi.any().default(i18n.__('customerUpdatePassword')['440']) },
                405: { message: Joi.any().default(i18n.__('supportVerifyOTP')['405']) },
                410: { message: Joi.any().default(i18n.__('supportVerifyOTP')['410']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    /** @memberof patchPassword */
    handler: patchPassword.handler
},
].concat(post);