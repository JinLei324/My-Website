
const post = require('./post');
const get = require('./get');
const getCountry = require('./getCountry');
const getCurrency = require('./getCurrency');

module.exports = [].concat(
    post,
    get,    
    getCountry,
    getCurrency
);