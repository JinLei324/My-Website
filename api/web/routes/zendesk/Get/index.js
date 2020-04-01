
const getHistory = require('./getHistory');
const getTicket = require('./getTicket');
module.exports = [].concat(getHistory, getTicket);