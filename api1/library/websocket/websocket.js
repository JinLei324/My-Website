const mqtt = require('mqtt');
const logger = require('winston');
const config = require('../../config/components/websocket');
const configEnv = process.env;


logger.warn("--------------sad---webdocket")
// var options = { clientId: "ws_6"+ configEnv.appName + Math.floor(Math.random() * 1000000000000000) };
var options = {
    clientId: "ws_6" + configEnv.appName + Math.floor(Math.random() * 1000000000000000),
    username: configEnv.MQTT_USERNAME,
    password: configEnv.MQTT_PASSWORD,
    keepalive: 10,
    clean: false,
    protocolId: 'MQIsdp',
    protocolVersion: 3
};

const client = mqtt.connect(config.MQTT_WEBSOCKET_URL, options);
logger.warn('Test Demo MQTT WebSocket Connected')

client.on('connect', function () { // When connected
    logger.warn("-----------------webdocket")
    logger.warn("\n Web-socket connected");
});
client.on('error', function () {
    logger.warn("-----------------webdocket")
    logger.error("Web-Socket connection ERROR")
    client.end()
});
client.publish("test", "hiii", {}, function () {
    logger.warn("publish")
});
/**
 * options: object
 *  - qos (integer): 0 > fire and forget
 *          1 > guaranteed delivery
 *          2 > guaranteed delivery with awk
 */
function websocket_publish(topic, message, options, callback) {
    if (Array.isArray(topic)) {
        try {
            topic.forEach(function (listner) {
                if (listner != '' || listner != null || listner != undefined) {
                    client.publish(listner, JSON.stringify(message), options, function () { });
                }
                callback(null, { err: 0, message: 'Publish.' })
            });
        } catch (exec) {
            callback({ err: 1, message: exec.message })
        }
    } else {
        try {
            if (topic != '' || topic != null || topic != undefined) {
                client.publish(topic, JSON.stringify(message), options, function () { });
            }
            callback(null, { err: 0, message: 'Publish.' })
        } catch (exec) {
            callback({ err: 1, message: exec.message })
        }
    }


}


exports.publish = websocket_publish 