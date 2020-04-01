'use strict'


const cart = require('../../../../../../models/cart/cart');
const config = process.env;
const Joi = require('joi');
const i18n = require('../../../../../../locales/locales');
const logger = require('winston');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
    logger.info("get cart api request -----------------------")
    
        cart.getAllLaundry({
            userId: request.auth.credentials._id.toString()
        }, (err, data) => {
            
            if (err) {
                logger.error('Error occurred while getting cart : ' + err)
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            } else if (data.length > 0) {
                let cartId = '';
                let items = {};
                let products = [];
                let responseArray =[];
                async.each(data, (item, callback) => {
                        if (item) {
                            for (var k = 0; k < item.products.length; k++) {
                                item.products[k].productName = item.products[k].itemName
                                item.products[k].productId = item.products[k].productId
                                delete item.products[k].productName
                                products.push(item.products[k]);
                            }
                            item.products = products;
                             items =item;
                            callback();
                        } else {
                            callback();
                        }
                    }, function(err) {
                        responseArray.push(items);
                     
                    return reply({
                        message: request.i18n.__('cart')['200'],
                        data:  responseArray[0]
                    }).code(200);
                   
                });

            } else
               
                return reply({
                    message: request.i18n.__('cart')['404']
                }).code(404);
        
    });


}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
}

/**
 * A module that exports customer get cart handler, get cart validator! 
 * @exports handler 
 */
module.exports = {
    handler,
    validator
}