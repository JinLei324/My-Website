
const login = require('./login');
const logout = require('./logout');
const order = require('./order');
const driver = require('./driver');
const store = require('./store');
const servicezone = require('./servicezone');
const addresses = require('./addresses');
const profile = require('./profile');


module.exports = [].concat(
    login,
    logout,
    order,
    driver,
    store,
    servicezone,
    addresses,
    profile
);