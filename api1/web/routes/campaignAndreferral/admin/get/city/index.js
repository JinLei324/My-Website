const Joi = require("joi");
let get = require("./get");

const headerValidator = require('../../../../../middleware/validator');

const error = require('../../../../../../statusMessages/responseMessage'); 
module.exports = [
     
    {
        method: 'GET',
        path: '/admin/city',
        config: {
            tags: ['api', 'admin'],
            description: 'Get all cities one',
            notes: 'Get all city list',
            auth: false,
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: { message: error['getData']['200'] , data:Joi.any()},
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
            //         404: { message: error['getData']['404'] }
            //     }
            // }
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
            // response: {
            //     status: {
            //         200: { message: error['getData']['200'] , data:Joi.any()},
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg']['500']) },
            //         404: { message: Joi.any().default(i18n.__('getData']['404']) }
            //     }
            // }
        },
        /** @memberof get */
        handler: get.cityDetailsByCityIdsHandler

    }

];