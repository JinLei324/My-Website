/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const patch = require('./patch');


/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof Order-API-ROUTES 
*/
module.exports = [
     {
        method: 'PATCH',
        path: '/laundry/saveimage',
        config: {
            tags: ['api', 'laundry'],
            description: 'This api is used to upload the images',
            notes: 'This api uploads the image for the laundry order',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: {
                            orderId: Joi.number().required().description('number'),
                            productId: Joi.string().required().description('string'),
                            images : Joi.array().required().description("Images"),
                         },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['200'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handlerUploadImage
    }
]