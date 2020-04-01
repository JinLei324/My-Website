
'use strict';

const headerValidator = require('../../../middleware/validator');

const entity = "/customer";
const errorMsg = require('../../../../locales');
const getWalletDetail = require('./get');

module.exports = [
    /**
    * api to get wallet detail
    */
    {
        method: 'GET',
        path: entity + '/walletDetail',
        handler: getWalletDetail.APIHandler,
        config: {
            tags: ['api', 'wallet'],
            description: errorMsg['apiDescription']['customerGetWalletDetail'],
            notes: errorMsg['apiDescription']['customerGetWalletDetail'],
            auth: 'customerJWT',
            // response: getWalletDetail.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]