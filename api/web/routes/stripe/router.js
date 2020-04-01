'use strict';

const customer = require('./customer');
const stripeConnect = require('./stripeConnect');
const subscription = require('./subscription');
const stripeConnectAdmin = require('./stripeConnectAdmin');
module.exports = [].concat(
    customer,
    stripeConnect,
    subscription,
	stripeConnectAdmin
);