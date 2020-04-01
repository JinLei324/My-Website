'use strict'
const childProducts = require('../../../../../models/childProducts');
const zones = require('../../../../../models/zones');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const moment = require('moment');//date-time
const logger = require('winston');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
   // request.headers.language = "en"; // remove in last
    childProducts.getFavorite({ zoneId: request.params.zoneId,storeId: request.params.storeId, userId: request.auth.credentials._id.toString() }, (err, childProduct) => {
        if (err) {
            logger.error('Error occurred while getting shoppingList : ' + err)
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (childProduct.length > 0) {
            for (var j = 0; j < childProduct.length; j++) {
                childProduct[j].productName = childProduct[j].productname ? childProduct[j].productname[request.headers.language] : "";
                childProduct[j].storeName = childProduct[j].storeName ? childProduct[j].storeName[request.headers.language] : "";
                childProduct[j].storeAddress = childProduct[j].storeAddress ? childProduct[j].storeAddress : "";
                childProduct[j].storeLogo = childProduct[j].profileLogos ? childProduct[j].profileLogos.logoImage : "";
                childProduct[j].bannerImage = childProduct[j].bannerLogos ? childProduct[j].bannerLogos.bannerimage : "";

                childProduct[j].mobileImage = childProduct[j].images ? childProduct[j].images : [];
                childProduct[j].THC = childProduct[j].THC ? childProduct[j].THC : "";
                childProduct[j].sku = childProduct[j].sku ? childProduct[j].sku : "";
                childProduct[j].CBD = childProduct[j].CBD ? childProduct[j].CBD : "";
                childProduct[j].storeLatitude = childProduct[j].storeCoordinates.latitude ? childProduct[j].storeCoordinates.latitude : 0;
                childProduct[j].storeLongitude = childProduct[j].storeCoordinates.longitude ? childProduct[j].storeCoordinates.longitude : 0;
                childProduct[j].childProductId = childProduct[j]._id ? childProduct[j]._id : "";
                childProduct[j].parentProductId = childProduct[j].parentProductId ? childProduct[j].parentProductId : "";

                childProduct[j].unitId = childProduct[j].units ? childProduct[j].units[0]["unitId"] : "";
                childProduct[j].unitName = childProduct[j].units ? childProduct[j].units[0]["name"][request.headers.language] : "";
                childProduct[j].priceValue = childProduct[j].units ? parseFloat(childProduct[j].units[0]["price"]["en"]) : 0;
                childProduct[j].appliedDiscount = 0;
                childProduct[j].offerId = "";
                childProduct[j].finalPrice = parseFloat(childProduct[j].priceValue);
                if (childProduct[j].offer && childProduct[j].offer.length > 0) { // offers
                    logger.error(moment().unix());
                    for (let k = 0; k < childProduct[j].offer.length; k++) {
                        if (childProduct[j].offer[k].status == 1 && childProduct[j].offer[k].endDateTime > moment().unix() && childProduct[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                            if (childProduct[j].offer[k].discountType == 1) {//check offertype if percentage
                                // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                                childProduct[j].appliedDiscount = (childProduct[j].priceValue / 100) * parseFloat(childProduct[j].offer[k].discountValue);
                                childProduct[j].offerId = childProduct[j].offer[k].offerId ? childProduct[j].offer[k].offerId : "";
                                // childProduct[j].finalPrice = childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                childProduct[j].finalPrice = (childProduct[j].appliedDiscount > childProduct[j].priceValue) ? 0 : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                            }
                            // }

                            if (childProduct[j].offer[k].discountType == 0) {//check offertype if flat discount
                                // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                                childProduct[j].appliedDiscount = parseFloat(childProduct[j].offer[k].discountValue);
                                childProduct[j].offerId = childProduct[j].offer[k].offerId ? childProduct[j].offer[k].offerId : "";
                                // childProduct[j].finalPrice = childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                childProduct[j].finalPrice = (childProduct[j].appliedDiscount > childProduct[j].priceValue) ? 0 : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                // }
                            }
                        }
                    }
                }
                childProduct[j].units = childProduct[j].units ? childProduct[j].units : [];
                delete childProduct[j].profileLogos;
                delete childProduct[j].images;
                delete childProduct[j].units;
                delete childProduct[j]._id;
                // delete childProduct[j].mobileImage;
                delete childProduct[j].storeCoordinates;
            }
            // return reply({ message: error['shoppingList']['200'][request.headers.language], data: childProduct }).code(200);
            return reply({ message: request.i18n.__('shoppingList')['200'], data: childProduct }).code(200);
        } else
            // return reply({ message: error['shoppingList']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('shoppingList')['404'] }).code(404);
    });

}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    zoneId: Joi.string().required().description('string'),
    storeId: Joi.string().required().description('string')
}

/**
* A module that exports customer favorites! 
* @exports handler 
*/
module.exports = { validator, handler }