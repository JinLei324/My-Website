
'use strict'
const cart = require('../../../../models/cart');
const error = require('../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const webSocket = require('../../../../library/websocket/websocket');
const logger = require('winston');
const async = require('async');
const valiDateAddOns = require('../../../commonModels/addOns');

/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
    let createdBy = '';
    switch (request.auth.credentials.sub) {
        case 'customer':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'manager':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        case 'guest':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'dispatcher':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        default:
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
    }
    cart.patchDetails({
        createdBy: request.auth.credentials.sub,
        cartId: request.payload.cartId,
        unitId: request.payload.unitId,
        userId: request.auth.credentials._id.toString(),
        quantity: request.payload.quantity,
        childProductId: request.payload.childProductId
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while updating to cart : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else {
            sendNotification({
                userId: request.auth.credentials._id.toString(),
                childProductId: request.payload.childProductId,
                unitId: request.payload.unitId,
                quantity: request.payload.quantity,
                message: "modified quantity"
            });
            // return reply({ message: error['cart']['203'][request.headers.language] }).code(203);
            return reply({
                message: request.i18n.__('cart')['203']
            }).code(203);
        }

    });
};

/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handlerCustomCart = (request, reply) => {
    let createdBy = '';
    switch (request.auth.credentials.sub) {
        case 'customer':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'manager':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        case 'guest':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'dispatcher':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        default:
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
    }
    cart.patchDetailsCustom({
        createdBy: request.auth.credentials.sub,
        cartId: request.payload.cartId,
        unitId: request.payload.unitId,
        userId: request.auth.credentials._id.toString(),
        quantity: request.payload.quantity,
        childProductId: request.payload.childProductId,
        unitPrice: request.payload.unitPrice
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while updating to cart : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else {
            sendNotification({
                userId: request.auth.credentials._id.toString(),
                childProductId: request.payload.childProductId,
                unitId: request.payload.unitId,
                quantity: request.payload.quantity,
                message: "modified quantity"
            });
            // return reply({ message: error['cart']['203'][request.headers.language] }).code(203);
            return reply({
                message: request.i18n.__('cart')['203']
            }).code(203);
        }

    });
};

function sendNotification(proData) {
    webSocket.publish('cartUpdates/', proData, {
        qos: 2
    }, (mqttErr, mqttRes) => { });
}

const handlerWithAddOns = (request, reply) => {

    var packId = request.payload.packId;
    var increaseType = request.payload.increase
    let createdBy = '';
    switch (request.auth.credentials.sub) {
        case 'customer':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'manager':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        case 'guest':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'dispatcher':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        default:
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
    }
    if (request.payload.storeType == 1) {

        /*
            @ Check if packid is not empty 
                    Then check increase type
                    if 0 - decrease the quantity of that pack by 1
                    if 1 - increase the quantity of that pack by 1
            @ If pack id is empty
                    Then check the Increase type
                    if 0 - Decrease the quantity of the lastly added item 
                    if 1 - Increase the quantity of the lastly added item
        */
        let quantityToUpdate = 1;
        if (increaseType == 0) {
            quantityToUpdate = -1;
        }
        if (packId && packId !== "0") {

            cart.UpdateQuantityOfItem({
                createdBy: request.auth.credentials.sub,
                cartId: request.payload.cartId,
                unitId: request.payload.unitId,
                userId: request.auth.credentials._id.toString(),
                quantity: quantityToUpdate,
                childProductId: request.payload.childProductId,
                packId: parseInt(request.payload.packId),
            }, (err, data) => {
                if (err) {
                    logger.error('Error occurred while updating to cart : ' + err);
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                    return reply({
                        message: request.i18n.__('genericErrMsg')['500']
                    }).code(500);
                } else {
                    sendNotification({
                        userId: request.auth.credentials._id.toString(),
                        childProductId: request.payload.childProductId,
                        unitId: request.payload.unitId,
                        quantity: "1",
                        message: "Decreased quantity"
                    });

                    return reply({
                        message: request.i18n.__('cart')['203'],
                        data: {
                            packId: request.payload.packId
                        }
                    }).code(203);
                }

            });
        } else {
            /*
            @ Get the user cart data. Items array sorted by add to cart timestamp
            @ Update the lastly added data 
            */

            cart.getCartByIdItemsSorted({
                cartId: request.payload.cartId,
            }, (err, cartData) => {
                if (err) {
                    logger.error('Error occurred while updating to cart : ' + err);

                    return reply({
                        message: request.i18n.__('genericErrMsg')['500']
                    }).code(500);
                } else {

                    // Update the lastly added item
                    let cartDetails = cartData;
                    let lastAddedItemTimeStamp = cartData[0].items.addedToCartOn;

                    cart.UpdateQuantityOfItem({
                        createdBy: request.auth.credentials.sub,
                        cartId: request.payload.cartId,
                        unitId: request.payload.unitId,
                        userId: request.auth.credentials._id.toString(),
                        quantity: quantityToUpdate,
                        childProductId: request.payload.childProductId,
                        packId: lastAddedItemTimeStamp,
                    }, (err, data) => {

                        if (err) {
                            logger.error('Error occurred while updating to cart : ' + err);

                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        } else {
                            sendNotification({
                                userId: request.auth.credentials._id.toString(),
                                childProductId: request.payload.childProductId,
                                unitId: request.payload.unitId,
                                quantity: "1",
                                message: "Decreased quantity"
                            });

                            return reply({
                                message: request.i18n.__('cart')['203'],
                                data: {
                                    packId: lastAddedItemTimeStamp
                                }
                            }).code(203);
                        }

                    });
                }
            });
        }

    } else {

        cart.patchDetails({
            createdBy: request.auth.credentials.sub,
            cartId: request.payload.cartId,
            unitId: request.payload.unitId,
            userId: request.auth.credentials._id.toString(),
            quantity: request.payload.quantity,
            childProductId: request.payload.childProductId
        }, (err, data) => {
            if (err) {
                logger.error('Error occurred while updating to cart : ' + err);
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            } else {
                sendNotification({
                    userId: request.auth.credentials._id.toString(),
                    childProductId: request.payload.childProductId,
                    unitId: request.payload.unitId,
                    quantity: request.payload.quantity,
                    message: "modified quantity"
                });
                // return reply({ message: error['cart']['203'][request.headers.language] }).code(203);
                return reply({
                    message: request.i18n.__('cart')['203'],
                    data: {
                    }
                }).code(203);
            }

        });
    }



};


/**
@ added on 12-09-2018
 * Function for custom cart . 
 * @params : 
            @cartId : string id of the cart which needs to be updated
            @packId : string . Unique id for each item in the cart as "addedToCartOn"
            @addOns : array of objects which needs to be updated
                      [ 
                        {
                            "addOnGroup" : [ 
                                "5b7c00b7f8016807815556c8"
                                ],
                                "id" : "5b7bfdadf80168038b205dd6",
                                "packId" : "5b97ad1221d92e362ca3bcc2"
                            }
                    ]
 * @exports handler 
 */
const handlerUpdateAddOns = (request, reply) => {
    var packId = request.payload.packId;
    let createdBy = '';
    let addOnsData = request.payload.addOns;
    let storeType = request.payload.storeType;
    let addOnFlag = 0;
    if (addOnsData && addOnsData.length > 1) {
        addOnFlag = 1
    }

    switch (request.auth.credentials.sub) {
        case 'customer':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'manager':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        case 'guest':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id
            break;
        case 'dispatcher':
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.payload.customerId
            break;
        default:
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
    }
    if (request.payload.storeType == 1) {
        // Check if the product id , unit id exists with the same addOns the increase the quantity of the same
        cart.isExistsWithItem({
            userId: request.auth.credentials._id.toString(),
            childProductId: request.payload.childProductId,
            unitId: request.payload.unitId
        }, (err, isItem) => {
            if (err) {
                logger.error('Error occurred while checking cart : ' + err);
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            }
            if (storeType = 1) {
                /*
                    @ If store type is 1 (resturant)
                    @ Check if cart has same addons 
                    @ If same addOns then increase the count else make a new entry
                */

                let addedItems = isItem.items;
                let matchedItems = [];
                let addOnsMatched = 0;
                async.each(addedItems, (addedItem, callback) => {
                    if (!("removedFromCartOn" in addedItem)) {
                        if (addedItem.addOns) {
                            let checkAddOnsStatus = valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData);
                            if (valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData)) {
                                addOnsMatched = 1;
                                /*
                                Increase the count
                                */
                                if (addedItem.addedToCartOn == parseInt(packId)) {
                                    return reply({
                                        message: request.i18n.__('cart')['203']
                                    }).code(203);
                                } else {
                                    cart.updateQuantity({
                                        cartId: isItem._id,
                                        childProductId: request.payload.childProductId,
                                        unitId: request.payload.unitId,
                                        quantity: 1,
                                        userId: request.auth.credentials._id.toString(),
                                        customerName: "",
                                        createdBy: request.auth.credentials.sub,
                                        addedToCartOn: addedItem.addedToCartOn,
                                    }, (err, res) => {
                                        if (err) {
                                            return reply({
                                                message: request.i18n.__('genericErrMsg')['500']
                                            }).code(500);
                                        } else {
                                            // Remove the old product from the cart
                                            if (addedItems.length > 1) {
                                                cart.removeCartItem({
                                                    cartId: isItem._id,
                                                    childProductId: request.payload.childProductId,
                                                    unitId: request.payload.unitId,
                                                    quantity: 1,
                                                    userId: request.auth.credentials._id.toString(),
                                                    customerName: "",
                                                    createdBy: request.auth.credentials.sub,
                                                    addedToCartOn: parseInt(packId),
                                                }, (removeItemError, removeItemResponse) => {
                                                    if (removeItemError) {
                                                        return reply({
                                                            message: request.i18n.__('genericErrMsg')['500']
                                                        }).code(500);
                                                    } else {
                                                        return reply({
                                                            message: request.i18n.__('cart')['203']
                                                        }).code(203);
                                                    }
                                                })
                                            } else {
                                                return reply({
                                                    message: request.i18n.__('cart')['203']
                                                }).code(203);
                                            }


                                        }
                                    });


                                }


                                // break;
                                // next('unique!');

                            }
                        }


                    }
                })
                if (addOnsMatched == 0) {
                    // Update the cart with the new addOns requested
                    cart.updateAddOns({
                        cartId: isItem._id,
                        childProductId: request.payload.childProductId,
                        unitId: request.payload.unitId,
                        userId: request.auth.credentials._id.toString(),
                        customerName: "",
                        createdBy: request.auth.credentials.sub,
                        packId: request.payload.packId,
                        addOns: request.payload.addOns,
                        addOnsAdded: addOnFlag
                    }, (err, res) => {

                        if (err) {
                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        } else {
                            return reply({
                                message: request.i18n.__('cart')['203']
                            }).code(203);
                        }

                    });
                }
            } else {
                return reply({
                    message: request.i18n.__('cart')['412']
                }).code(412);
            }
        });
    }
};



module.exports = {
    handler,
    handlerCustomCart,
    handlerWithAddOns,
    handlerUpdateAddOns
}