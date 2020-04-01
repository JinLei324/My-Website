
const emails = require('./emails');

const appVersion = require('./appVersion');

const driverOperations = require('./driverOperations');

const shiftLogs = require('./shiftLogs');

const pushNotifications = require('./pushNotifications');
const wallet = require('./wallet');

module.exports = [].concat(appVersion, emails, driverOperations, shiftLogs, pushNotifications, wallet);