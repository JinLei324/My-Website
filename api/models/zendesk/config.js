'use strict'

const joi = require('joi')
const envVarsSchema = joi.object({
    ZD_URL: joi.string().uri().required(),
    ZD_EMAIL: joi.string().required(),
    ZD_PASS: joi.string().required(),
    ZD_TOKEN: joi.string().required(),
    ZD_API_URL:joi.string().required(),
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)
const config = {
    zd_url: envVars.ZD_URL,
    zd_email: envVars.ZD_EMAIL,
    zd_pass:envVars.ZD_PASS,
    zd_token: envVars.ZD_TOKEN,
    zd_api_url: envVars.ZD_API_URL,
}
module.exports = config
