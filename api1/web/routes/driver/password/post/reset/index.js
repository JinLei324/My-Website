'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../../../middleware/validator');
 
 
/** @namespace */
const postReset = require('./post'); 
/** @namespace */
const i18n = require('../../../../../../locales/locales');/** @global */
const Joi = require('joi');

module.exports =   [  
     
        {
            method: 'POST',
            path: '/driver/resetPassword',
            config: {
                tags: ['api', 'driver'],
                description: 'API to reset password',
                notes: 'API to reset password',
                auth: false,
                validate: {
                    /** @memberof postReset */
                    payload: postReset.validator
                }
            },
            /** @memberof postReset */
            handler: postReset.handler
        },
         
      ]