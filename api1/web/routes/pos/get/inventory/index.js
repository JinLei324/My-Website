
'use strict';

/** @global */
const headerValidator = require('../../../../middleware/validator');
const Joi = require('joi');
const posInventoryCheck = require('./get');
/** @namespace */
const i18n = require('../../../../../locales/locales');



module.exports = [
    {
        method: 'GET',
        path: '/pos/checkout/{storeId}/{childProductId}/{unitId}/{quantity}',
        config: {// "tags" enable swagger to document API
            tags: ['api', 'pos'],
            description: 'to check items price and quantity exist or not',
            notes: "to check items price and quantity exist or not", // We use Joi plugin to validate request
            validate: {
                /** @memberof posInventoryCheck */
                params: posInventoryCheck.payload,
                  /** @memberof headerValidator */
                  headers: headerValidator.language,
                  /** @memberof headerValidator */
                  failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('stores')['200']),
                        data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('checkOperationZone')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: posInventoryCheck.APIHandler
    }
]