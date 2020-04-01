
'use strict'

const joi = require('joi')

const envVarsSchema = joi.object({
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_MODE: joi.string().required()
}).unknown()
    .required()

const { error, value: envVars } = joi.validate(process.env, envVarsSchema)
if (error) {
    throw new Error(`Config validation error: ${error.message}`)
}

const config = {
    stripe: {
        STRIPE_SECRET_KEY: envVars.STRIPE_SECRET_KEY,
        STRIPE_MODE: envVars.STRIPE_MODE
    }
}

module.exports = config