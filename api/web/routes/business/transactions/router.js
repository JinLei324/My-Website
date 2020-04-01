
'use strict';

const headerValidator = require('../../../middleware/validator');

const entity = "/store";
const i18n = require('../../../../locales/locales');
const getWalletTransaction = require('./get');
const Joi = require('joi')

module.exports = [
    /**
    * api to get wallet transctions
    */
    {
        method: 'GET',
        path: entity + '/walletTransaction/{pageIndex}',
        handler: getWalletTransaction.APIHandler,
        config: {
            tags: ['api', 'wallet'],
            description: "This api return all the transactions done by the store",
            notes: "This api return all the transactions done by the store",
            auth: 'dispatcher',
            // response: getWalletTransaction.responseCode,
            validate: {
                params: getWalletTransaction.payloadValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]