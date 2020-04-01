
'use strict';

const headerValidator = require('../../../middleware/validator');

const entity = "/customer";
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
            auth: 'customerJWT',
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