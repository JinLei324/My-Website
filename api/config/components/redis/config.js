
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    redisConfHost: joi.string().required(),
    redisConfPort: joi.string().required(),
    redisConfPass: joi.string().required()
}).unknown()
    .required()

const envVars = joi.attempt(process.env, envVarsSchema)

module.exports = envVars;
// module.exports = [envVars.redisConfHost, envVars.redisConfPort];
