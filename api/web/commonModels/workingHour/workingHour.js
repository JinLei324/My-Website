
'use strict';

const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const moment = require('moment');
const redis = require('../../../library/redis');

const workingHour = require('../../../models/workingHour');
const stores = require('../../../models/stores');
const storeElastic = require('../../../models/storeElastic');

const workingHourCheck = (storeId, reply) => {

    let flag = false;
    let nextOpen = {
        'startTime': '',
        'endTime': ''
    };
    var currenctDate = new Date(moment().format("YYYY-MM-DD HH:mm:ss"));
    var currenctTime = moment().unix();

    var currentDay = moment().format('ddd');

    const checkStoreOpen = () => {
        return new Promise((resolve, reject) => {
            let condition = {
                'storeId': storeId,
                $or: [
                    {
                        'startDateISO': { '$lte': currenctDate },
                        'endDateISO': { '$gte': currenctDate },
                    },
                    {
                        'startDateISO': { '$gte': currenctDate },
                    }
                ],
                "status": 1,
            };

            workingHour.readById(condition, (err, result) => {
                if (err)
                    resolve(true);
                else if (result.length > 0) {
                    async.each(result, (store, callback) => {



                        var startTime = moment(moment().format("YYYY-MM-DD") + " " + store.startTime + ":00").unix();
                        var endTime = moment(moment().format("YYYY-MM-DD") + " " + store.endTime + ":00").unix();
                        if (startTime > endTime) {
                            if (currenctTime < endTime) {
                                startTime = moment(moment().add('-1', 'days').format("YYYY-MM-DD") + " " + store.startTime + ":00").unix();
                            } else {
                                endTime = moment(moment().add('+1', 'days').format("YYYY-MM-DD") + " " + store.endTime + ":00").unix();
                            }
                            // if (currenctTime > startTime) {
                            //     endTime = moment(moment().add('+1', 'days').format("YYYY-MM-DD") + " " + store.endTime + ":00").unix();
                            // } else if (currenctTime < endTime) {
                            //     startTime = moment(moment().add('-1', 'days').format("YYYY-MM-DD") + " " + store.startTime + ":00").unix();
                            // }
                        } else {
                            //nothing
                        }
                        if (currenctTime >= moment(store.startDateISO).unix() && currenctTime <= moment(store.endDateISO).unix()) {
                            // running slot
                            for (let i = 0; i < 7; i++) {
                                let nextDay = moment(new Date()).add(i, 'days').format('ddd');
                                let nextDayStartTime = moment.unix(startTime).add(i, 'days').unix();
                                let nextDayendTime = moment.unix(endTime).add(i, 'days').unix();
                                var currenctDateCheck = moment.unix(nextDayStartTime).format("YYYY-MM-DD");
                                let currenctDateCheckArray = store.date[currenctDateCheck];
                                let slotTime = {
                                    'startTime': '',
                                    'endTime': ''
                                };
                                if (typeof currenctDateCheckArray != "undefined" && currenctDateCheckArray.length > 0) {
                                    for (let j = 0; j < currenctDateCheckArray.length; j++) {
                                        let nextDayStartTimeSlot = currenctDateCheckArray[j].startDateTimestamp;
                                        let nextDayendTimeSlot = currenctDateCheckArray[j].endDateTimestamp;
                                        if (currenctTime < nextDayendTimeSlot) {
                                            if (slotTime['startTime'] == '') {
                                                slotTime['startTime'] = nextDayStartTimeSlot;
                                                slotTime['endTime'] = nextDayendTimeSlot;
                                            } else if (slotTime['startTime'] > nextDayStartTimeSlot) {
                                                slotTime['startTime'] = nextDayStartTimeSlot;
                                                slotTime['endTime'] = nextDayendTimeSlot;
                                            }
                                        }
                                    }
                                    if (store['day'].indexOf(nextDay) > -1 && (currenctTime < nextDayendTime)) {
                                        if (nextOpen['startTime'] == '') {
                                            nextOpen['startTime'] = slotTime['startTime'];
                                            nextOpen['endTime'] = slotTime['endTime'];
                                        } else if (nextOpen['startTime'] > nextDayStartTime) {
                                            nextOpen['startTime'] = slotTime['startTime'];
                                            nextOpen['endTime'] = slotTime['endTime'];
                                        }
                                    }
                                } else {
                                    if (store['day'].indexOf(nextDay) > -1 && (currenctTime < nextDayendTime)) {
                                        if (nextOpen['startTime'] == '') {
                                            nextOpen['startTime'] = nextDayStartTime;
                                            nextOpen['endTime'] = nextDayendTime;
                                        } else if (nextOpen['startTime'] > nextDayStartTime) {
                                            nextOpen['startTime'] = nextDayStartTime;
                                            nextOpen['endTime'] = nextDayendTime;
                                        }
                                    }
                                }
                            }
                            if (nextOpen['startTime'] <= currenctTime && nextOpen['endTime'] >= currenctTime && store['day'].indexOf(currentDay) > -1) {
                                flag = true;
                            } else {
                            }
                            callback()
                        } else {
                            // future slot
                            for (let i = 0; i < 7; i++) {
                                let nextDay = moment(new Date()).add(i, 'days').format('ddd');
                                let nextDayStartTime = moment.unix(startTime).add(i, 'days').unix();
                                let nextDayendTime = moment.unix(endTime).add(i, 'days').unix();
                                var currenctDateCheck = moment.unix(nextDayStartTime).format("YYYY-MM-DD");
                                let currenctDateCheckArray = store.date[currenctDateCheck];
                                let slotTime = {
                                    'startTime': '',
                                    'endTime': ''
                                };
                                if (typeof currenctDateCheckArray != "undefined" && currenctDateCheckArray.length > 0) {
                                    for (let j = 0; j < currenctDateCheckArray.length; j++) {
                                        let nextDayStartTimeSlot = currenctDateCheckArray[j].startDateTimestamp;
                                        let nextDayendTimeSlot = currenctDateCheckArray[j].endDateTimestamp;
                                        if (currenctTime < nextDayendTimeSlot) {
                                            if (slotTime['startTime'] == '') {
                                                slotTime['startTime'] = nextDayStartTimeSlot;
                                                slotTime['endTime'] = nextDayendTimeSlot;
                                            } else if (slotTime['startTime'] > nextDayStartTimeSlot) {
                                                slotTime['startTime'] = nextDayStartTimeSlot;
                                                slotTime['endTime'] = nextDayendTimeSlot;
                                            }
                                        }
                                    }
                                    if (store['day'].indexOf(nextDay) > -1 && (currenctTime < nextDayendTime)) {
                                        if (nextOpen['startTime'] == '') {
                                            nextOpen['startTime'] = slotTime['startTime'];
                                            nextOpen['endTime'] = slotTime['endTime'];
                                        } else if (nextOpen['startTime'] > nextDayStartTime) {
                                            nextOpen['startTime'] = slotTime['startTime'];
                                            nextOpen['endTime'] = slotTime['endTime'];
                                        }
                                    }
                                } else {
                                    if (store['day'].indexOf(nextDay) > -1 && (currenctTime < nextDayendTime)) {
                                        if (nextOpen['startTime'] == '') {
                                            nextOpen['startTime'] = nextDayStartTime;
                                            nextOpen['endTime'] = nextDayendTime;
                                        } else if (nextOpen['startTime'] > nextDayStartTime) {
                                            nextOpen['startTime'] = nextDayStartTime;
                                            nextOpen['endTime'] = nextDayendTime;
                                        }
                                    }
                                }
                            }
                            callback()
                        }
                    }, (err, resultData) => {
                        resolve(true);
                    });
                } else {

                    resolve(true);
                }
            });
        });
    };

    checkStoreOpen()
        .then(data => {
            var result = {
                'storeIsOpen': flag,
                'nextOpenTime': "",
                'nextCloseTime': ""
            }
            if (nextOpen['startTime'] != '') {
                result['nextOpenTime'] = nextOpen['startTime'];
                result['nextCloseTime'] = nextOpen['endTime'];
            }
            redis.client.del('storeOpen_' + storeId, function (err, reply) { });
            redis.client.del('storeNextOpen_' + storeId, function (err, reply) { });
            if (result.storeIsOpen) {
                let expiry = (result.nextCloseTime - moment().unix()) + 1;
                result['nextOpenTime'] = '';
                logger.warn("store will close after : ", expiry);
                redis.client.setex('storeOpen_' + storeId, expiry, result.nextCloseTime, (err, res) => { });
            } else if (result.nextOpenTime != '') {
                let expiry = (result.nextOpenTime - moment().unix()) + 1;
                logger.warn("store will open after : ", expiry);
                redis.client.setex('storeNextOpen_' + storeId, expiry, result.nextOpenTime, (err, res) => { });
            } else {
                logger.warn("No Matching Slot found for store : ", storeId);
            }
            let updObj = {
                q: {
                    '_id': new ObjectID(storeId)
                },
                data: {
                    '$set': result
                }
            };
            stores.update(updObj, (err, res) => {
                storeElastic.Update(storeId.toString(), result, (err, resultelastic) => {
                    if (err) {
                        logger.error(err);
                        return reply({ message: 'error in update elastic', data: err });
                    }
                    return reply(null, result);
                })
            });
        }).catch(err => {
            logger.error("Error in working hour", err);
            return reply(err, null);
        });
}

const syncStores = () => {
    stores.readAll({}, (err, result) => {
        async.each(result, (item, callback) => {

            workingHourCheck(item._id.toString(), (err, res) => {
                callback();
            })
        }, function (error2) {
            if (error2) {

            }
        })
    })
}

module.exports = { workingHourCheck, syncStores };