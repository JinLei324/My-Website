
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    SLACK_WEBHOOKS_URL: joi.string().required(),
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;