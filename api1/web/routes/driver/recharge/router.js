
'use strict';

const headerValidator = require('../../../middleware/validator');

const entity = "/driver";
const errorMsg = require('../../../../locales');

const postWalletRecharge = require('./post');

module.exports = [
    /**
    * api to recharge wallet
    */
    {
        method: 'POST',
        path: entity + '/rechargeWallet',
        handler: postWalletRecharge.APIHandler,
        config: {
            tags: ['api', 'wallet'],
            description: errorMsg['apiDescription']['customerRechargeWallet'],
            notes: errorMsg['apiDescription']['customerRechargeWallet'],
            auth: 'driverJWT',
            response: postWalletRecharge.responseCode,
            validate: {
                payload: postWalletRecharge.payloadValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]