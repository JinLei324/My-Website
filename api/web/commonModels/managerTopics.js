/** @global */
const logger = require("winston");
const Config = process.env;
const ObjectID = require("mongodb").ObjectID;
const customerModel = require("../../models/customer");
const driverModel = require("../../models/driver");
const client = require("../../library/redis");
const moment = require("moment");
const driverPresence = require("../../models/driverPresence");
const storeManagers = require("../../models/storeManagers");
const driverPresenceDaily = require("../../models/driverPresenceDaily");
const async = require("async");
const webSocket = require("../../library/websocket/websocket");
const sendToWebsocket = (params, qos, callback) => {
  storeManagers.getAll({ storeId: params.storeId.toString(), status: 2 }, (err, storeManager) => {
    if (err) {
      logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
    }
    let mqttManagerTopic = [];
    if (storeManager.length > 0) {
      for (let s = 0; s < storeManager.length; s++) {
        mqttManagerTopic.push(
          "storeManager/" +
          params.cityId +
          "/" +
          (params.franchiseId || 0) +
          "/" +
          params.storeId.toString() +
          "/" +
          storeManager[s]._id.toString()
        );
      }
    }

    storeManagers.getAll({ cityId: params.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
      if (err) {
        logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
      }
      if (cityManager.length > 0) {
        for (let k = 0; k < cityManager.length; k++) {
          mqttManagerTopic.push("cityManager/" + params.cityId + "/" + cityManager[k]._id.toString());
        }
      }

      params.destinationName = "orderUpdate";
      // logger.warn("sending to mangers mqttManagerTopic " + mqttManagerTopic);
      webSocket.publish(mqttManagerTopic, params, { qos: qos }, function (mqttErr, mqttRes) { });
    });
  });
};
module.exports = { sendToWebsocket };
