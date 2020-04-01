'use strict'

const headerValidator = require('../../middleware/validator');
const Joi = require('joi');
const GetCentralProductByStoreCategory = require('./GetCentralProductByStoreCategory');


module.exports = [
    {
        method: 'GET',
        path: '/search/products/{storeCategoryId}/{categoryId}/{productName}',
        handler: GetCentralProductByStoreCategory.handler,
        config: {
            tags: ['api', 'search'],
            description: 'Api to get products based on store category.',
            notes: "This API allows user to get products based on store category.",
            auth: false,
            validate: {
                params: GetCentralProductByStoreCategory.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            }
        }
    }
];