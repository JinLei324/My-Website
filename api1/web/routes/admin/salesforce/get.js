'use strict'

//var products = require('../../../../../models/products');
//var productsElastic = require('../../../../../models/productElastic');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
const salesforce = require('../../../../library/salesforce');
const Auth = require('../../../middleware/authentication');
const handler = (request, reply) => {

    //let accessTokenExp = 604800;//7days 
    // let authToken = Auth.SignJWT({ _id: '5c2e0c7b087d925b1d395b23', key: 'acc', deviceId: request.params.AuthSF }, 'customer', accessTokenExp);//sign a new JWT
    let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YzJlMGM3YjA4N2Q5MjViMWQzOTViMjMiLCJrZXkiOiJhY2MiLCJkZXZpY2VJZCI6IjVjMmUwYzdiMDg3ZDkyNWIxZDM5NWIyMyIsImlhdCI6MTU0NzYyNDk2MiwiZXhwIjoxNTQ4MjI5NzYyLCJzdWIiOiJjdXN0b21lciJ9.AZDqRaEuINQ4MeAukHApvPKzM3PyDY2pMeHHnVqfDjY';




    if (request.params.AuthSF != '' && request.params.AuthSF != null && request.params.AuthSF == token) {
        salesforce.login(() => {
            var authData = salesforce.get();
            if (authData) {
                return reply({ message: request.i18n.__('store')['200'], data: authData }).code(200);
                /* superagent
                     .post(authData.instanceUrl + '/services/apexrest/delivx/Store')
                     .send(DataToSF) // sends a JSON post body
                     .set('Accept', 'application/json')
                     .set('Authorization', 'Bearer ' + authData.accessToken)
                     .end((err, res) => {
                         if (err) {

                         }
                     });*/
            } else {
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
        });
    } else {
        return reply({ message: request.i18n.__('slaveSignIn')['404'], data: "Not Found" }).code(404);
    }
}

const validator = {
    AuthSF: Joi.string().description('Super Admin: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YzJlMGM3YjA4N2Q5MjViMWQzOTViMjMiLCJrZXkiOiJhY2MiLCJkZXZpY2VJZCI6IjVjMmUwYzdiMDg3ZDkyNWIxZDM5NWIyMyIsImlhdCI6MTU0NzYyNDk2MiwiZXhwIjoxNTQ4MjI5NzYyLCJzdWIiOiJjdXN0b21lciJ9.AZDqRaEuINQ4MeAukHApvPKzM3PyDY2pMeHHnVqfDjY')
}

module.exports = { handler, validator }