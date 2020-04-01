
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    NEXMO_ACCOUNT_SID: joi.string().required(),
    NEXMO_AUTH_TOKEN: joi.string().required()
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;