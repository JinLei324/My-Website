/** @global */
const Joi = require('joi')
/** @namespace */
const store = require('./patch');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');


/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [

    {
        method: 'PATCH',
        path: '/store',
        config: {
            tags: ['api', 'store'],
            description: 'Api for updating store ',
            notes: 'Api for adding store.\n\n"name":["string"]\n\n"ownerName":"string"\n\n"countryCode":"string"\n\n"countryId":"string"\n\n"ownerPhone":"string"\n\n"ownerEmail":"string"\n\n"businessNumber":"string"\n\n"password":"password"\n\n"website":"string"\n\n"description":["description"]\n\n"businessAddress":["businessAddress"]\n\n"billingAddress":["billingAddress"]\n\n"cityId":"string"\n\n"cityName":"string"\n\n"postalCode":"string"\n\n"driverExist":"string"\n\n"coordinates":{ "longitude" : -117.1916241,"latitude" : 32.7303662}\n\n"businessZoneId":"string"\n\n"businessZoneName":"string"\n\n"serviceZones":"["string"]"\n\n"firstCategory":"["string"]"\n\n"firstCategoryTesting":"["string"]"\n\n"secondCategory":"["string"]"\n\n"status":"number"\n\n"pricingStatus":"string"\n\n"minimumOrder":"string"\n\n"freeDeliveryAbove":"string"\n\n"pickupCash":"number"\n\n"pickupCard":"number"\n\n"cash":"number"\n\n"card":"number"\n\n"orderType":"string"\n\n"baseFare":"number"\n\n"pricePerMile":"number"\n\n"range":"string"\n\n"budget":"string"\n\n"grocerDriver":"string"\n\n"storeDriver":"string"\n\n"offlineDriver":"string"\n\n"Country":"string"\n\n"cityname":"string"\n\n"countryname":"string"\n\n"City":"string"\n\n"maxImagesForProducts":"string"\n\n"Basefare":"string"\n\n"Pricepermile":"string"\n\n"googleplusUrl":"string"\n\n"facebookUrl":"string"\n\n"twitterUrl":"string"\n\n"instagramUrl":"string"\n\n"orderEmail":"string"\n\n"deliveryCash":"number"\n\n"deliveryCard":"number"\n\n"imageFlag":"string"\n\n"logoImage":"string"\n\n"bannerImage":"string"\n\n"posID":"string"\n\n',
            auth: false,
            validate: {
                /** @memberof validator */
                payload: store.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: {
            //             message: error['store']['200'], data: Joi.any().example({})
            //         },
            //         400: { message: error['store']['400'] },
            //         404: { message: error['store']['404'] },
            //         500: {
            //             message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({
            //             })
            //         }
            //     }
            // }
        },
        /** @memberof manager */
        handler: store.handler,
    }
]