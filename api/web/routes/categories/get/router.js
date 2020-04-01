/** @global */
const Joi = require('joi')
/** @namespace */
const getCategories = require('./get');

/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const error = require('../../../../locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
   
    {
        method: 'GET',
        path: '/category/{storeCategoryId}',
        config: {
            tags: ['api', 'category'],
            description: 'This api is used to get all product categories and store category atributes which belongs to store category type.',
            notes: 'This api is used to get all product categories and store category atributes which belongs to store category type.',
            auth:  {
                strategies: ['guestJWT', 'customerJWT']
            },
            validate: {
                /** @memberof getHomeCategories */
                params: getCategories.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: error['store']['200'], data: Joi.any().example({
                            "productCategoryDetails": [
                              {
                                "_id": "5c8a670a087d9244c03e9113",
                                "categoryName": "laundry test"
                              }
                            ],
                            "storeCategoryAttributeDetails": [
                              {
                                "_id": "5c85cf83087d92532240b96d",
                                "attributes": [
                                  {
                                    "id": "5c85cf83087d92532240b96c",
                                    "attributeName": "sdfsadf"
                                  },
                                  {
                                    "id": "5c8652ab087d925f7417c453",
                                    "attributeName": "test"
                                  }
                                ],
                                "storeCategoryGroupName": "xccz"
                              }
                            ]
                          })
                    },
                    400: { message: error['store']['400'] },
                    404: { message: error['store']['404'] },
                    500: { message: error['genericErrMsg']['500'] }
                }
            },
        },
        /** @memberof manager */
        handler: getCategories.handler,
    }
]