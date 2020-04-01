const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')

let get = require("./get");

const headerValidator = require('../../../../middleware/validator');

const error = require('../../../../../locales'); 
module.exports = [
     
    {
        method: 'GET',
        path: '/admin/city',
        config: {
            tags: ['api', 'admin'],
            description: 'Get all cities two',
            notes: 'Get all city list',
            auth: false,
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getData')['200'] , data:Joi.any()},
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'] },
                    404: { message: Joi.any().default(i18n.__('getData')['404'] }
                }
            }
        },
        /** @memberof get */
        handler: get.handler

    },
    {
        method: 'GET',
        path: '/admin/cityDetailsByCityIds/{cityIds}',
        config: {
            tags: ['api', 'admin'],
            description: 'Get city details by city id',
            notes: 'Get city details by city Id',
            auth: false,
            validate:
            // 
            {
                /**@memberOf get**/
                params: get.cityDetailsByCityIdsValidator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getData')['200'] , data:Joi.any()},
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) }
                }
            }
        },
        /** @memberof get */
        handler: get.cityDetailsByCityIdsHandler

    }

];