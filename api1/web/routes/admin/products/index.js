 const add = require('./add');
 const update = require('./update');
 const remove = require('./remove');
 const get = require('./get');
 

module.exports = [].concat(add, update, remove, get); 