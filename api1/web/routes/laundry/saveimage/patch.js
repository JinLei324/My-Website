'use strict'
const orders = require('../../../../models/bookingsUnassigned')
const error = require('../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handlerUploadImage = (request, reply) => {
orders.Update({"orderId":request.payload.orderId,'Items.productId':request.payload.productId},{'Items.$.images':request.payload.images},function (err, responseData) {
    if(err){
        return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
    }
    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['200']) }).code(200);
})   
 
};
const validator = {
    orderId: Joi.number().required().description('number'),
    productId: Joi.string().required().description('string'),
    images: Joi.array().required().description('image'),
}
/**
 
 * @exports validator
 * @exports handler 
 */
module.exports = {
    handlerUploadImage,
    validator
}