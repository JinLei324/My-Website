/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const nearestZones = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
 * A module that exports business API  routes to hapi server!
 * @exports BUSINESS-ZONE-API-ROUTES 
 */
module.exports = [{
        method: 'POST',
        path: '/dispatcher/zones',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'City wise zones',
            notes: 'City wise zones.',
            auth: 'managerJWT',
            validate: {
                /** @memberof nearestZones */
                payload: nearestZones.validatorCityWise,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('supportFAQ')['200']),
                        data: Joi.any()
                    },
                    400: {
                        message: Joi.any().default(i18n.__('checkOperationZone')['400'])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            }
        },
        /** @memberof nearestZones */
        handler: nearestZones.handlerCityWiseZone
    }, {
        method: 'GET',
        path: '/dispatcher/city',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Get all cities',
            notes: 'Get all city list',
            auth: false,
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('getData')['200']),
                        data: Joi.array().items([
                            Joi.object().keys({
                                "cityId": Joi.any().default("5ac5ec7ae0dc3f3fff33d7f2"),
                                "cityName": Joi.any().default("Big Bear Lake"),
                                "currency": Joi.any().default("USD")
                            })
                        ])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    },
                    404: {
                        message: Joi.any().default(i18n.__('getData')['404'])
                    }
                }
            }
        },
        /** @memberof get */
        handler: nearestZones.handler

    }, {
        method: 'GET',
        path: '/city/zones/{cityId}',
        config: {
            tags: ['api', 'City'],
            description: 'All zones by city id',
            notes: 'All zones by city id',
            auth: false,
            validate: {
                /** @memberof nearestZones */
                params:  nearestZones.validatorCityWise,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                // headers: headerValidator.headerAuthValidator,
                // * @memberof headerValidator
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('supportFAQ')['200']),
                        data: Joi.any()
                    },
                    400: {
                        message: Joi.any().default(i18n.__('checkOperationZone')['400'])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            }
        },
        /** @memberof nearestZones */
        handler: nearestZones.handlerCityWiseZone
    },

]