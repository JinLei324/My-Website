'use strict';

const Pushy = require('pushy');
const config = require('../../web/config/components/pushy');
/** 
 * Plug in your Secret API Key 
 */
const pushyAPI = new Pushy(config.pushy.api_key);


/** 
 * Function to send push notification to a specified topic 
 * topic: should follow [a-zA-Z0-9-_.~%] format
 * payload: must be object 
        format: { 
            notification : { body : "string", title : "string", icon : "string" },
            data: { field1: 'value1', field2: 'value2' } // values must be string
 */
function sendPushToTopic(topic, payload, options) {

    /** 
     * Send a message to devices subscribed to the provided topic.
     */
    return new Promise((resolve, reject) => {

        pushyAPI.sendPushNotification(payload.data, topic, { notification: payload.notification }, function (error, id) {
            if (error) {
                reject({ err: 1, message: error.message, error: error });
            } else {
                resolve({ err: 0, message: "notification sent", id: id });
            }
        });
    })

}


/**
 * Function to send push notification to specified push tokens
 * registrationTokens: Array of registration tokens(push tokens)  
 * payload: must be object 
        format: { 
            notification : { body : "string", title : "string", icon : "string" },
            data: { field1: 'value1', field2: 'value2' } // values must be string
 */
function sendPushToToken(registrationTokens, payload, options) {

    /** 
     * Send a message to devices using push tokens.
     */
    return new Promise((resolve, reject) => {

        if (Array.isArray(registrationTokens) && registrationTokens.length > 0) {

            pushyAPI.sendPushNotification(payload.data, registrationTokens, { notification: payload.notification }, function (error, id) {
                if (error) {
                    reject({ err: 1, message: error.message, error: error });
                } else {
                    resolve({ err: 0, message: "notification sent", id: id });
                }
            });

        } else {
            reject({ err: 1, message: 'registrationTokens: Array expected.', error: error });
        }
    })

}

/** export the functions */
exports.sendPushToTopic = sendPushToTopic
exports.sendPushToToken = sendPushToToken

/**
 * Ref:
 *  Initialize: https://firebase.google.com/docs/admin/setup#initialize_the_sdk
 *  Send Message to a topic: https://firebase.google.com/docs/cloud-messaging/admin/send-messages#send_to_a_topic
 */
