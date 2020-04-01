
'use strict';

const headerValidator = require('../../../../middleware/validator');
const i18n = require('../../../../../locales/locales');



const postRespondTo = require('./post');

module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/driver/respondToRequest', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'booking'],
            description: 'This API allows user to post booking Response.',
            notes: "This API allows user to post booking Response.",
            auth: 'driverJWT',
            validate: {
                payload: postRespondTo.payload,
                /** @memberof headerValidator */
                headers: headerValidator.driverHeaderAuthValidator,//headerAuthValidator,
                /** @memberof headerValidator */
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            },
            // response: {
            //     status: {
            //         200: {
            //             message: error['driverList']['200']['0']
            //         },
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            //     }
            // }
        },
        handler: postRespondTo.APIHandler
    }
]