let PostAPI = require('./Post');
let getByIdAPI = require("./Get");
const headerValidator = require('../../../middleware/validator');


module.exports = [

    {
        method: 'POST',
        path: '/message',
        handler: PostAPI.handler,
        config: {
            description: 'This API used to get messages.',
            tags: ['api', 'Chat'],
            auth: "basicChatModule",
            // auth: false,
            validate: {
                headers: headerValidator.headerAuthValidator,
                payload: PostAPI.validator,
                failAction: (req, reply, source, error) => {
                    failAction: headerValidator.faildAction(req, reply, source, error)
                }
            }
        }
    },
    {

        method: 'Get',
        path: '/chatHistory/{bookingId}/{pageNo}',
        handler: getByIdAPI.handler,
        config: {
            description: 'This API used to get messages.',
            tags: ['api', 'Chat'],
            auth: "basicChatModule",
            // auth: false,
            validate: {
                // headers: headerValidator.headerAuthValidator,
                params: getByIdAPI.validator,
                failAction: (req, reply, source, error) => {
                    failAction: headerValidator.faildAction(req, reply, source, error)
                }
            }
        }
    }
];