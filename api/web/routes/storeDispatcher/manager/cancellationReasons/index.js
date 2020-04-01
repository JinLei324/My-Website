/** @global */
const Joi = require('joi')
/** @namespace */
const getByToken = require('./get');
/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-cancellationReasons-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/cancellationReasons',
        config: {
            tags: ['api', 'manager'],
            description: 'GET cancellationReasons info',
            notes: "This Api will enable managers to get cancellationReasons.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any()
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: getByToken.handler
    }
]