const post = require('./post');
const get = require('./get');
const patch = require('./patch');
const deleteCard = require('./delete');

module.exports = [].concat(
    post,
    get,
    patch,
    deleteCard
);