/** @global */
const Joi = require('joi')
/** @namespace */
const deleteCategory = require('./delete');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');


/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [

    {
        method: 'DELETE',
        path: '/deleteCategory/{categoryId}/{type}/{storeId}',
        config: {
            tags: ['api', 'admin'],
            description: 'Api for updating product details ',
            notes: 'Api for update product details.',
            auth: false,
            validate: {
                /** @memberof validator */
                params: productDetails.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: {
            //             message: error['store']['200'], data: Joi.any().example({
            //             })
            //         },
            //         400: { message: error['store']['400'] },
            //         404: { message: error['store']['404'] },
            //         500: {
            //             message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({
            //             })
            //         }
            //     }
            // }
        },
        /** @memberof manager */
        handler: deleteCategory.handler,
    }
]