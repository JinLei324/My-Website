/**
 * swagger module.
 * @module swagger
 * @see module:swagger
 */
const inert = require('inert');
const vision = require('vision');

const swagger = {
    register: require('hapi-swagger'),
    'options': {
        "schemes": ["https","http"],
        grouping: 'tags',
        payloadType: 'form'
    }
}

module.exports = { inert, vision, swagger };