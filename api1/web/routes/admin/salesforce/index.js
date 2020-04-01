/** @global */
const Joi = require('joi')
/** @namespace */
const product = require('./get');

/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
    /**
    * api to add product
    */
    {
        method: 'GET',
        path: '/SalesforceAuthData/{AuthSF}',
        config: {
            tags: ['api', 'Salesforce'],
            description: 'Api for get Salesforce AUTHDATA.',
            notes: 'Api for get Salesforce AUTHDATA.: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YzJlMGM3YjA4N2Q5MjViMWQzOTViMjMiLCJrZXkiOiJhY2MiLCJkZXZpY2VJZCI6IjVjMmUwYzdiMDg3ZDkyNWIxZDM5NWIyMyIsImlhdCI6MTU0NzYyNDk2MiwiZXhwIjoxNTQ4MjI5NzYyLCJzdWIiOiJjdXN0b21lciJ9.AZDqRaEuINQ4MeAukHApvPKzM3PyDY2pMeHHnVqfDjY ',
            auth: false,
            validate: {
                /** @memberof validator */
                params: product.validator,
                /** @memberof language */
                //headers: headerValidator.language,
                /** @memberof headerValidator */
                //failAction: headerValidator.customError
            },
            /* response: {
                 status: {
                     200: { message: error['products']['200'], data: Joi.any().example({}) },
                     404: { message: error['store']['404'], data: Joi.any().example({}) },
                     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                 }
             },*/
        },
        /** @memberof manager */
        handler: product.handler,
    }
]