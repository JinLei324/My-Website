
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    MQTT_WEBSOCKET_URL: joi.string().required(),
    MQTT_PASSWORD: joi.string().required(), 
    MQTT_PASSWORD:joi.string().required(),
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;