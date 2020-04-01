const connectAccount = require('./connectAccount');
const externalAccount = require('./externalAccount');

module.exports = [].concat(
    connectAccount,
    externalAccount
);