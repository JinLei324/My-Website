const post = require('./post');
const patch = require('./patch');
const deleteCard = require('./delete');

module.exports = [].concat(
    post,
    patch,
    deleteCard
);