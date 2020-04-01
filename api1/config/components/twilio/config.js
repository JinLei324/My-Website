
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    TWILIO_ACCOUNT_SID: joi.string().required(),
    TWILIO_AUTH_TOKEN: joi.string().required(),
    CELL_PHONE_NUMBER: joi.string().required(),
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;