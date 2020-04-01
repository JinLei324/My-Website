const add = require('./add');
const remove = require('./remove');
const patch = require('./patch');


module.exports = [].concat(add, remove, patch);
