
const entity = '/franchise';

const Joi = require('joi')
const get = require('./get');
const getByCustomerId = require('./getByCustomerId');
const getByDriverId = require('./getByDriverId');
const patch = require('./patch');
const cancelorder = require('../../../commonModels/orders/cancelorder');
const i18n = require('../../../../locales/locales');
const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'GET',
        path: entity + '/orders/{customerId}/{index}',
        handler: getByCustomerId.handler,
        config: {
            tags: ['api', entity],
            description: "This API is used to get orders based customerID.",
            notes: "This API is used to get orders based customerID.",
            auth: 'dispatcher',
            response: getByCustomerId.responseCode,
            validate: {
                params: getByCustomerId.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'GET',
        path: entity + '/ongoingOrders/{driverId}/{index}',
        handler: getByDriverId.handler,
        config: {
            tags: ['api', entity],
            description: "This API is used to get orders based driverId.",
            notes: "This API is used to get orders based driverId.",
            auth: 'dispatcher',
            response: getByDriverId.responseCode,
            validate: {
                params: getByDriverId.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'PATCH',
        path: entity + '/order/status',
        handler: patch.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to change the order status.',
            notes: "This API is used to change the order status.",
            // auth: 'dispatcher',
            auth: {
                strategies: ['dispatcher', 'storeAdminJWT', 'AdminJWT']
            },
            response: patch.responseCode,
            validate: {
                payload: patch.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'PATCH',
        path: entity + '/order/cancelorder',
        handler: cancelorder.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to cancel order.',
            notes: "This API is used to cancel order.",
            // auth: 'dispatcher',
            auth: {
            strategies: ['dispatcher', 'storeAdminJWT', 'AdminJWT']
            },
            response: patch.responseCode,
            validate: {
                payload: patch.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                return reply({ message: error.output.payload.message }).code(error.output.statusCode);
            }
            }
            }
        },
    {
        method: 'GET',
        path: '/orders/{cityId}/{index}/{franchiseId}/{storeId}/{fromDate}/{toDate}/{search}',
        handler: get.handler,
        config: {
            tags: ['api', entity],
            description: "This API is used to get orders based storeid.",
            notes: "This API is used to get orders based storeid.",
            auth: 'dispatcher',
            response: get.responseCode,
            validate: {
                params: get.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]
