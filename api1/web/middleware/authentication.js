/** @global */
const HAPI_AUTH_JWT = require("./hapi-auth-jwt2");
const JWT = require("jsonwebtoken");
const logger = require("winston");
const Config = process.env;
const ObjectID = require("mongodb").ObjectID;
const customerModel = require("../../models/customer");
const driverModel = require("../../models/driver");
const adminUsers = require("../../models/superadmin");
const managerModel = require("../../models/storeManagers");
const stores = require("../../models/stores");
const client = require("../../library/redis");
const users = require("../../models/users");
// const _self = require()
/**
 * Method to validate the credentials
 * @param {*} cb(111)etc /// this cb has to match with the switch case given in ../hapi-auth-jwt2/lib/index.js file
 * @param {*} password
 */

/**
 * Method to generate a JWT token
 * @param {*} data - the claims to be included in the jwt
 * @param {*} type - the subject, which will differentiate the tokens (master, slave or admin)
 */
const SignJWT = (data, type, expTime) => {
  updateAccessCode(type, data, () => { }); //asynchronously update the access code in respective databae documents   // removed
  return JWT.sign(data, Config.Secret, {
    expiresIn: expTime,
    subject: type
  });
};

/**
 * Method to validate the slaves' JWT
 * @param {*} decoded - decoded token
 * @param {*} cb - callback
 */
const ValidateJWT = (decoded, req, cb) => {
  validateAccessCode(decoded._id, decoded.sub, decoded.deviceId, req, allow => {
    let isValid = decoded.key == "acc" && allow ? true : false;
    return cb(null, allow);
  });
};
/**
 * Method to validate the refresh ' JWT
 * @param {*} decoded - decoded token
 * @param {*} cb - callback
 */
const ValidateRefJWT = (decoded, req, cb) => {
  validateAccessCode(decoded._id, decoded.sub, decoded.deviceId, req, allow => {
    let isValid = decoded.key == "ref" && allow ? true : false;
    return cb(null, isValid);
  });
};

/**
 * Method to update the accessCode asynchronously
 * @param {*} type - to identify the collection name to update
 * @param {*} data - the accessCode to update
 * @param {*} cb - callback
 */
const updateAccessCode = (type, data, cb) => {
  // logger.error(JSON.stringify(data));
  // logger.error('JSON.stringify(data)');
  let modelName;
  switch (type) {
    case "customer":
      modelName = customerModel;
      break;
    case "driver":
      modelName = driverModel;
      break;
    case "manager":
      modelName = managerModel;
      break;
    case "dispatcher":
      modelName = users;
      break;
    default:
      return cb();
  }
  modelName.updateAccessCode(data, (err, doc) => {
    if (err) return logger.info(`err ${err}`);
    return cb(null, 1);
  });
  // client.set('acc_' + data._id, data.deviceId);//update the deviceId for caching
  // client.expire('acc_' + data._id, 60 * 60);//TTL of 1hour
};

/**
 * Method to validate the accessCode
 * First check for the accessCode in the redis cache if found, & is true return true
 * If accessCode is not found in the cache, search in the mongoDb, if found & is true return true
 * Cache the id & accessCode
 * @param {*} id
 * @param {*} type
 * @param {*} cb
 */
const validateAccessCode = (id, type, deviceId, req, cb) => {
  //  client.get('acc_' + id, (err, reply) => {
  //     if (deviceId === reply) {
  //         return cb(true);
  //     }

  var condition;

  switch (type) {
    case "customer":
      if (req.route.settings.auth.strategies.indexOf("customerJWT") != -1) {
        condition = { _id: new ObjectID(id), "mobileDevices.deviceId": deviceId };

        customerModel.isExistsWithCond(condition, (err, data) => {
          if (err) return cb(4);
          if (data) {
            req.user = data;
            switch (data.status) {
              // case 0: return cb(3); break; //cb unverified
              case 1:
                return cb(2);
                break; //cb reject
              case 2:
                return cb(0);
                break; //cb success
              case 3:
                return cb(1);
                break; //cb ban
              case 4:
                return cb(111);
                break; //cb ban /// this cb has to match with the switch case given in ../hapi-auth-jwt2/lib/index.js file
              default:
                return cb(0);
            }
          } else {
            return cb(4); // cb session expired
          }
        });
      } else {
        return cb(false);
      }
      break;
    case "guest":
      if (req.route.settings.auth.strategies.indexOf("guestJWT") != -1) {
        condition = { _id: new ObjectID(id), "mobileDevices.deviceId": deviceId };

        customerModel.isExistsWithCond(condition, (err, data) => {
          if (err) return cb(4);
          if (data) {
            req.user = data;
            switch (data.status) {
              // case 0: return cb(3); break; //cb unverified
              case 1:
                return cb(2);
                break; //cb reject
              case 2:
                return cb(0);
                break; //cb success
              case 3:
                return cb(1);
                break; //cb ban
              case 4:
                return cb(111);
                break; //cb ban /// this cb has to match with the switch case given in ../hapi-auth-jwt2/lib/index.js file
              default:
                return cb(0);
            }
          } else {
            return cb(4); // cb session expired
          }
        });
      } else {
        return cb(222);
      }
      break;
    case "driver":
      if (req.route.settings.auth.strategies.indexOf("driverJWT") != -1) {
        condition = { _id: new ObjectID(id), "mobileDevices.deviceId": deviceId };

        driverModel.isExistsWithCond(condition, (err, data) => {
          if (err) return cb(4);
          if (data) {
            req.user = data;
            req.user['name'] = data['firstName'] + " " + data['lastName']
            switch (data.status) {
              case 1:
                return cb(5);
                break; //cb unverified
              case 6:
                return cb(2);
                break; //cb reject
              case 7:
                return cb(1);
                break; //cb ban
              case 8:
                return cb(222);
                break; //cb ban
              default:
                return cb(0);
            }
          } else {
            return cb(4); // cb session expired
          }
        });
      } else {
        return cb(false);
      }
      break;
    case "manager":
      if (req.route.settings.auth.strategies.indexOf("managerJWT") != -1) {
        condition = { _id: new ObjectID(id), "mobileDevices.deviceId": deviceId };
        managerModel.count(condition, (err, Count) => {
          if (err) return cb(4);
          if (Count === 0) return cb(4);
          //     client.set('acc_' + id, deviceId);//update the accessCode for caching
          //  client.expire('acc_' + id, 60 * 60);//TTL of 1hour
          return cb(0);
        });
      } else {
        return cb(false);
      }
      break;
    case "dispatcher":
      if (req.route.settings.auth.strategies.indexOf("dispatcher") != -1) {
        condition = { _id: new ObjectID(id), deviceId: deviceId };
        users.count(condition, (err, Count) => {
          if (err) return cb(4);
          if (Count === 0) return cb(4);
          return cb(0);
        });
      } else {
        return cb(false);
      }
      break;
    case "admin":
      if (req.route.settings.auth.strategies.indexOf("AdminJWT") != -1) {
        let adminCond = {
          _id: new ObjectID(id)
        };
        adminUsers.isExistsWithCond(adminCond, (err, result) => {
          // result.source = "admin";
          req.user = result;
          return err ? cb(false) : result === null ? cb(false) : cb(0);
        });
      } else {
        return cb(false);
      }
      break;
    case "storeadmin":
      if (req.route.settings.auth.strategies.indexOf("storeAdminJWT") != -1) {
        let adminCond = {
          _id: new ObjectID(id)
        };
        stores.isExistsWithCond(adminCond, (err, result) => {
          // result.source = "admin";
          req.user = result;
          return err ? cb(false) : result === null ? cb(false) : cb(0);
        });
      } else {
        return cb(false);
      }
      break;
    case "franchiseadmin":
      if (req.route.settings.auth.strategies.indexOf("franchiseAdminJWT") != -1) {
        let adminCond = {
          _id: new ObjectID(id)
        };
        adminUsers.isExistsWithCond(adminCond, (err, result) => {
          // result.source = "admin";
          req.user = result;
          return err ? cb(false) : result === null ? cb(false) : cb(0);
        });
      } else {
        return cb(false);
      }
      break;
    default:
      return cb(0);
  }

  // });
};

/**
 * A module that exports basicChatModuleDecode AUTH object
 * @exports basicChatModuleDecode
 */
const basicChatModuleDecode = (decoded, req, cb) => {
  if (decoded._id) {
    return cb(null, 0);
  } else {
    return cb("in Valid Auth", null);
  }
};
const tokenError = context => {

  if (context.errorType == "TokenExpiredError" && context.attributes && context.attributes.key == "acc") {
    let authToken = SignJWT(
      { _id: context.attributes._id, key: "ref", deviceId: context.attributes.deviceId },
      context.attributes.sub,
      "60000"
    ); //sign a new JWT
    context.errorType = 440;
    context.message = context.message;
    context.refToken = authToken;
  } else {
    context.errorType = 498;
    context.message = context.message
      ? context.message
      : "Your session has expired, please login again to continue accessing your account.";
    // context.message = 'Your session has expired, please login again to continue accessing your account.';
  }
  return context;
};
const refTokenError = context => {
  context.errorType = 498;
  // context.message = 'context.message';
  context.message = "Your session has expired, please login again to continue accessing your account.";
  return context;
};
/**
 * A module that exports basicChatModule AUTH object
 * @exports basicChatModule
 */
const basicChatModule = {
  key: process.env.Secret,
  validateFunc: basicChatModuleDecode,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: function (context) {
    return tokenError(context);
  }
};
/**
 * A module that exports refreshJWT AUTH object
 * @exports refreshJWT
 */
const refreshJWT = {
  key: process.env.Secret,
  validateFunc: ValidateRefJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return refTokenError(context);
  }
};
/**
 * A module that exports storeAdminJWT AUTH object
 * @exports storeAdminJWT
 */
const storeAdminJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};
/**
 * A module that exports storeAdminJWT AUTH object
 * @exports franchiseAdminJWT
 */
const franchiseAdminJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true }
};
/**
 * A module that exports AdminJWT AUTH object
 * @exports AdminJWT
 */
const AdminJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true }
};

/**
 * A module that exports driverJWT AUTH object
 * @exports driverJWT
 */
const driverJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};

/**
 * A module that exports guestJWT AUTH object
 * @exports guestJWT
 */
const guestJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};
/**
 * A module that exports customerJWT AUTH object
 * @exports customerJWT
 */
const customerJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};
/**
 * A module that exports managerJWT AUTH object
 * @exports managerJWT
 */
const managerJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};

/**
 * A module that exports authJWT AUTH object
 * @exports authJWT
 */
const authJWT = {
  key: process.env.Secret,
  validateFunc: (decoded, req, cb) => {
    return cb(null, true);
  },
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};
const dispatcherJWT = {
  key: process.env.Secret,
  validateFunc: ValidateJWT,
  verifyOptions: { algorithms: ["HS256"], ignoreExpiration: true },
  errorFunc: context => {
    return tokenError(context);
  }
};

// const HAPI_AUTH_JWT = HAPI_AUTH_JWT;

module.exports = {
  basicChatModule,
  basicChatModuleDecode,
  SignJWT,
  ValidateJWT,
  refreshJWT,
  authJWT,
  dispatcherJWT,
  driverJWT,
  customerJWT,
  managerJWT,
  guestJWT,
  AdminJWT,
  storeAdminJWT,
  HAPI_AUTH_JWT,
  franchiseAdminJWT
};
