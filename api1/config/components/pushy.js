'use strict'

const joi = require('joi');
const envVarsSchema = joi.object({
    PUSHY_API_KEY: joi.string().required()
}).unknown().required()
const envVars = joi.attempt(process.env, envVarsSchema)
const config = {
    pushy: {
        api_key: envVars.PUSHY_API_KEY
    }
}
module.exports = config