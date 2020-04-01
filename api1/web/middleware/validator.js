/**@global */
const Joi = require('joi');
const headerAuthValidator = Joi.object({
    'authorization': Joi.string().required().description('header authorization').error(new Error('Invalid token enter valid')),
    'language': Joi.string().required().description('en - English').error(new Error('Language is incorrect')).required()
}).unknown();//validate the auth token present in the header
const headerAuthValidatorNew = Joi.object({
    'authorization': Joi.string().required().description('header authorization').error(new Error('Invalid token enter valid')),
    'language': Joi.string().required().description('en - English').error(new Error('Language is incorrect')).required(),
}).unknown();//validate the auth token present in the header
const headerAuthValidatorDriver = Joi.object({
    'authorization': Joi.string().required().description('header authorization').error(new Error('Invalid token enter valid')),
    'language': Joi.string().required().description('en - English').error(new Error('Language is incorrect')).required(),
}).unknown();//validate the auth token present in the header
const language = Joi.object({
    'language': Joi.string().required().description('en - English').error(new Error('Language is incorrect')).required(),
}).unknown();//select language type
const languageDriver =Joi.object({
    'language': Joi.string().required().description('en - English').error(new Error('Language is incorrect')).required(),
}).unknown();//select language type
const customError = (req, reply, source, error) => {
    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
}

const headerAuthValidatorChat = Joi.object({
    'authorization': Joi.string().required().description('header authorization').error(new Error('Invalid token enter valid')),
    'lan': Joi.number().integer().min(0).max(1).default(0).description('0 - English').error(new Error('Language is incorrect')).required(),
}).unknown();
const faildAction = function faildAction(req, reply, source, error) {
    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
}

/**
* A module that exports headerAuthValidator,customError,language!
* @exports headerAuthValidator
* @exports language
* @exports customError  
*/
module.exports = {headerAuthValidatorChat, faildAction,headerAuthValidatorNew, headerAuthValidator,headerAuthValidatorDriver, language,languageDriver, customError };