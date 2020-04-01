"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
// const tableName = 'storeManagers'
const tableName = "users";
const ObjectID = require("mongodb").ObjectID;

/**
 * @function
 * @name isExists
 * @param {object} condition - data coming from controller
 */
const isExists = (condition, callback) => {
  db.get()
    .collection(tableName)
    .findOne(condition, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name isExistsWithId
 * @param {object} condition - data coming from controller
 */
const isExistsWithId = (condition, callback) => {
  db.get()
    .collection(tableName)
    .findOne(condition, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name count
 * @param {object} condition - data coming from controller
 */
const count = (condition, callback) => {
  db.get()
    .collection(tableName)
    .count(condition, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name count
 * @param {object} condition - data coming from controller
 */
const countOne = (condition, callback) => {
  db.get()
    .collection(tableName)
    .count(condition, (err, result) => {
      return callback(err, result);
    });
};

/**
 * @function
 * @name updateDeviceLog
 * @param {object} params - data coming from controller
 */
const updateDeviceLog = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(
      { _id: new ObjectID(params.id) },
      {
        $set: {
          userType: params.userType,
          status: params.status,
          mobileDevices: {
            deviceId: params.deviceId,
            deviceType: parseInt(params.deviceType),
            pushToken: params.pushToken ? params.pushToken : "",
            lastLogin: moment().unix(),
            currentlyActive: true
          },
          fcmManagerTopic: params.fcmManagerTopic,
          mqttManagerTopic: params.mqttManagerTopic,
          fcmStoreTopic: params.fcmStoreTopic,
          fcmTopic: params.fcmStoreTopi,
          mqttStoreTopic: params.mqttStoreTopic,
          mqttTopic: params.mqttTopic
        }
      },
      { upsert: true },
      (err, result) => {
        return callback(err, result);
      }
    );
};
/**
 * @function
 * @name updateAccessCode
 * @param {object} params - data coming from controller
 */
const updateAccessCode = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(
      { _id: new ObjectID(params._id) },
      {
        $set: { "mobileDevices.deviceId": params.deviceId }
      },
      (err, result) => {
        return callback(err, result);
      }
    );
};
/**
 * @function
 * @name getAll
 * @param {object} condition - data coming from controller
 */
const getAll = (condition, callback) => {
  db.get()
    .collection(tableName)
    .find(condition)
    .toArray((err, result) => {
      return callback(err, result);
    });
};

const create = (params, callback) => {
  db.get()
    .collection(tableName)
    .insert(params, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name makeVerifyTrue
 * @param {object} params - data coming from controller
 */
const makeVerifyTrue = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(
      { countryCode: params.countryCode, phone: params.mobile },
      {
        $set: { mobileVerified: true }
      },
      { multi: true },
      (err, result) => {
        return callback(err, result);
      }
    );
};
/**
 * @function
 * @name isExistsCountrycode
 * @param {object} params - data coming from controller
 */
const isExistsCountrycode = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOne(
      {
        $or: [{ email: params.email }, { countryCode: params.countryCode, phone: params.phone }],
        status: { $nin: [4, "4"] }
      },
      (err, result) => {
        return callback(err, result);
      }
    );
};
/**
 * @function
 * @name setPassword
 * @param {object} params - data coming from controller
 */
const setPassword = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate({ _id: params._id }, { $set: { password: params.password } }, {}, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name changePassword
 * @param {object} params - data coming from controller
 */
const changePassword = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(
      { countryCode: params.countryCode, phone: params.mobile },
      {
        $set: { password: params.password }
      },
      { multi: true },
      (err, result) => {
        return callback(err, result);
      }
    );
};
/**
 * @function
 * @name getData
 * @param {object} params - data coming from controller
 */
const getData = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOne(
      { $or: [{ email: params.email }, { countryCode: params.countryCode, phone: params.phone }] },
      (err, result) => {
        return callback(err, result);
      }
    );
};

const get = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOne({ _id: new ObjectID(params.id) }, (err, result) => {
      return callback(err, result);
    });
};
const insert = (data, callback) => {
  db.get()
    .collection(tableName)
    .insert(data, (err, result) => {
      return callback(err, result);
    });
};

const update = (params, callback) => {
  db.get()
    .collection(tableName)
    .update(params.q, params.data, (err, result) => {
      return callback(err, result);
    });
};
// /**
//  * @function
//  * @name isExists
//  * @param {object} params - data coming from controller
//  */
// const isExistsWithId = (params, callback) => {
//     db.get().collection(tableName)
//         .findOne({
//             _id: params._id
//         }, (err, result) => {
//             return callback(err, result);
//         });
// }

/**
 * @function
 * @name patchloggedOutStatus
 * @param {object} params - data coming from controller
 */
const patchloggedOutStatus = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(
      { _id: params._id },
      {
        $set: {
          status: params.status,
          "mobileDevices.lastLogin": moment().unix(),
          "mobileDevices.currentlyActive": false,
          fcmManagerTopic: ""
          // 'mqttManagerTopic':""
        }
      },
      { upsert: true },
      (err, result) => {
        return callback(err, result);
      }
    );
};
module.exports = {
  isExists,
  updateDeviceLog,
  count,
  updateAccessCode,
  isExistsWithId,
  getAll,
  create,
  makeVerifyTrue,
  setPassword,
  isExistsCountrycode,
  changePassword,
  getData,
  get,
  countOne,
  update,
  patchloggedOutStatus
};
