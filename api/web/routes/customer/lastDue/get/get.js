const completedOrders = require('../../../../../models/completedOrders');
const customer = require('../../../../../models/customer');
const Auth = require('../../../../middleware/authentication');
const config = process.env;
var Joi = require('joi');
const logger = require('winston');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');//date-time
const async = require('async');


const handler = (req, reply) => {

    let userData = {};
    let lastDue = 0;
    let isLastDueAvailable = false;
    let lastDueMsg = "";

    const readCustomer = () => {
        return new Promise((resolve, reject) => {
            customer.isExistsWithId({ _id: new ObjectId(req.auth.credentials._id) }, (err, doc) => {
                if (err) {
                    return reject({ message: "internal server error", code: 500 });
                } else if (doc) {
                    userData = doc;
                    if (userData.wallet && userData.wallet.balance && userData.wallet.balance < 0) {
                        lastDue = userData.wallet.balance;
                        isLastDueAvailable = true;
                        lastDueMsg = "Pay " + " " + lastDue * -1 + "  Outstanding from your previous order";
                    }
                    return resolve(true);
                } else {
                    return reject({ message: "booking not found", code: 404 });
                }
            });
        });
    }

    readCustomer()
        .then(data => {
            let response = {
                lastDue: lastDue,
                isLastDueAvailable: isLastDueAvailable,
                lastDueMsg: lastDueMsg
            }
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: response }).code(200);
        }).catch(e => {
            return reply({ message: e.message }).code(e.code);
        });
}

module.exports = { handler };