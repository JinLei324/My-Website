
'use strict';

const headerValidator = require('../../../../middleware/validator');

const entity = "/driver";
const errorMsg = require('../../../../../locales');
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
            description: errorMsg['apiDescription']['providerGetWalletDetail'],
            notes: errorMsg['apiDescription']['providerGetWalletDetail'],
            auth: 'driverJWT',
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