'use strict' 
const config = process.env;
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const Bcrypt = require('bcrypt');//hashing module 
const logger = require('winston'); ;
const stores = require('../../../../models/stores');




/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {

    const responseData = (data) => {
        return new Promise((resolve, reject) => {
            switch (req.auth.credentials.userType) {
                case 0://central
                    return resolve({
                        checkFreelancerDriver: false,
                        serviceZones: []
                    })
                    break;
                case 1://franchies
                    let serviceZonesForStore = [];
                    let checkFreelancerDriverForFran = false;
                    stores.readAll({ franchiseId: req.auth.credentials.franchiseId }, (err, storeBaseFran) => {
                        if (err) {
                            return resolve(data);
                        } else if (storeBaseFran.length > 0) {
                            storeBaseFran.forEach(element => {
                                if (element.serviceZones && element.serviceZones.length > 0 && element.driverType == 2) {
                                    checkFreelancerDriverForFran = true;
                                    serviceZonesForStore = serviceZonesForStore.concat(element.serviceZones);
                                }

                            });
                            return resolve({
                                checkFreelancerDriver: checkFreelancerDriverForFran,
                                serviceZones: serviceZonesForStore || []
                            })
                        } else {
                            return resolve({
                                checkFreelancerDriver: checkFreelancerDriverForFran,
                                serviceZones: serviceZonesForStore || []
                            })
                        }

                    });
                    break;
                case 2://store
                    stores.getOne({ _id: new ObjectID(req.auth.credentials.storeId) }, (err, storeData) => {
                        if (err) {
                            return resolve(data);
                        } else {
                            if (storeData.driverType == 2) {
                                return resolve({
                                    checkFreelancerDriver: true,
                                    serviceZones: storeData.serviceZones || []
                                })
                            } else {
                                return resolve({
                                    checkFreelancerDriver: false,
                                    serviceZones: []
                                })

                            }

                        }

                    });
                    break;
                default:
                    return reject({ message: req.i18n.__('managerSignIn')['404'], code: 404 });
            }
        });
    }
    responseData()
        .then(data => {
            return reply({ message: req.i18n.__('customerAddressPost')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("customer postAddress API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
}

const responseCode = {

}//swagger response code
module.exports = {
    handler,
    responseCode
}