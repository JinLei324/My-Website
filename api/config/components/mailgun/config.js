
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    MAILGUN_AUTH_KEY: joi.string().required(),
    MAILGUN_DOMAIN_NAME: joi.string().required(), 
    MAILGUN_FROM_NAME:joi.string().required(),
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;