'use strict'

var category = require('../../../../models/firstCategory');
var storeCategoryAttributes = require('../../../../models/storeCategoryAttributes');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

const handler = (request, reply) => {
    let responseData ={};
    category.get(request.params.storeCategoryId, (err, resultData1) => {

        if (err){
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        for(var i=0;i<resultData1.length;i++){
            resultData1[i].categoryName = resultData1[i].categoryName[request.headers.language];
        }
         responseData.productCategoryDetails = resultData1;
        storeCategoryAttributes.get(request.params.storeCategoryId, (err, resultData2) => {
            
            if (err){
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            } 
            for(var h=0;h<resultData2.length;h++){
                resultData2[h].storeCategoryGroupName = resultData2[h].name[request.headers.language];
                delete resultData2[h].name;
                for(var k=0;k<resultData2[h].attributes.length;k++){
                    resultData2[h].attributes[k].attributeName = resultData2[h].attributes[k].name[request.headers.language];
                    delete resultData2[h].attributes[k].name;
                }
            }
            responseData.storeCategoryAttributeDetails = resultData2;
            return reply({ message: request.i18n.__('products')['200'], data: responseData }).code(200);
        })
    })

   
    


}

const validator = {
      storeCategoryId: Joi.string().required().description('storeCategoryId')
}

module.exports = { handler, validator }