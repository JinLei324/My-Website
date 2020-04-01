 
const order = require('./order');

const signUp = require('./signUp');


/**
* A module that exports Customer API  routes to hapi server!
* @exports POS-API-ROUTES 
*/
module.exports = [].concat( order, signUp);