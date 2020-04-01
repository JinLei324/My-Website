
'use strict';

const headerValidator = require('../../middleware/validator');

const entity = "/utility";

const keyRotation = require('./post');
const keyRotationCloudFunction = require('./postCloudFunction');
const fetchKey = require('./get');
const errorMsg = require('../../../locales');

module.exports = [
    /**
    * api to get languages
    */
    // {
    //     method: 'POST',
    //     path: entity + '/keyRotation',
    //     handler: keyRotation.APIHandler,
    //     config: {
    //         tags: ['api', 'keyRotation'],
    //         description: errorMsg['apiDescription']['keyRotation'],
    //         notes: errorMsg['apiDescription']['keyRotation'],
    //         auth: false,
    //         validate: {
    //             payload: keyRotation.payloadValidator,
    //             failAction: (req, reply, source, error) => {
    //                 return reply({ message: error.output.payload.message }).code(error.output.statusCode);
    //             }
    //         }
    //     }
    // },
    {
        method: 'POST',
        path: entity + '/keyRotationCloudFunction',
        handler: keyRotationCloudFunction.APIHandler,
        config: {
            tags: ['api', 'keyRotationCloudFunction'],
            description: errorMsg['apiDescription']['keyRotation'],
            notes: errorMsg['apiDescription']['keyRotation'],
            auth: false,
            validate: {
                payload: keyRotationCloudFunction.payloadValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'GET',
        path: entity + '/currentKey',
        handler: fetchKey.APIHandler,
        config: {
            tags: ['api', 'keyRotation'],
            description: errorMsg['apiDescription']['currentKey'],
            notes: errorMsg['apiDescription']['currentKey'],
            auth: false,
            validate: {
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]