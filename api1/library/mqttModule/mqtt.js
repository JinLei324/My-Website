'use strict'

const joi = require('joi')
const mqtt = require('mqtt');
const logger = require('winston');
const config = require('../../config/components/mqtt');
const superagent = require('superagent');
const configEnv = process.env;
// get ip address
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}
// var MqttClientId = "MQTT_CLIENT_" + Math.random(29);
var MqttClientId = "MQTT_CLIENT_APPSERVER" + configEnv.appName + Math.random().toString(16).substr(2, 8);

/**
 * options:
 *  - clientId
 *  - username
 *  - password
 *  - keepalive: number
 *  - clean:
 *  - will: 
 */
var mqtt_options = {
    clientId: MqttClientId,
    username: configEnv.MQTT_USERNAME,
    password: configEnv.MQTT_PASSWORD,
    keepalive: 10,
    clean: false
};
const client = mqtt.connect(configEnv.MQTT_URL, mqtt_options);

client.on("error", function (error) {
    // logger.error("Mqtt Error =>", error);
});

client.on('offline', function () {
    // logger.error("Mqtt offline ");
});

client.on('reconnect', function () {
    // logger.error("Mqtt reconnect ");
});

client.on('connect', function () {
    //   client.subscribe('driver_location_update');
});

client.on('message', function (topic, message) {
    //     logger.error(`received =>  " ${message.toString()} on ${topic}`);
    //     let incomingMessage = JSON.parse(message.toString());
    //     let header = { language: incomingMessage.language, authorization: incomingMessage.authorization };
    //      delete incomingMessage.language;
    //     delete incomingMessage.authorization;


    // if(header.language == undefined || header.language == "undefined"){

    // }else{
    // superagent.patch(configEnv.API_URL+'/driver/location')
    // .send(incomingMessage)
    // .set({   Accept: 'application/json','language': header.language, 'authorization': header.authorization })
    // .end(function (err, res) {
    // });
    // }

});

function notifyRealTime(request) {

    if (Array.isArray(request.listner)) {
        try {
            request.listner.forEach(function (listner) {
                if (listner != '' || listner != null || listner != undefined) {
                    client.publish(listner, JSON.stringify(request.message), { retain: false, qos: (typeof request.qos != 'undefined' && request.qos) ? request.qos : 2 })
                }
            });
        } catch (exec) {
            logger.error("Mqtt exception =>  ", exec);
        }
    } else {
        try {
            if (request.listner != '' || request.listner != null || request.listner != undefined) {

                client.publish(request.listner, JSON.stringify(request.message), { retain: false, qos: (typeof request.qos != 'undefined' && request.qos) ? request.qos : 2 })
            }
        } catch (exec) {
            logger.error("Mqtt exception =>  ", exec);
        }
    }
}

function mqttSubscribe(topic, options, callback) {
    try {
        client.subscribe(topic, { qos: (options.qos) ? options.qos : 0 });



        // logger.error('mqtt update from driver : ' + topic);



    } catch (exec) {
        callback({ err: 1, message: exec.message })
    }
    callback(null, { err: 0, message: 'Subscribed.' })
}

module.exports = { notifyRealTime, mqttSubscribe };