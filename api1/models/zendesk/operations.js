var Zendesk = require('zendesk-node-api');
var config = require('./config');

var zendesk = new Zendesk({
    url: config.zd_url,
    email: config.zd_email,
    token: config.zd_token
});

//create singleTicket 
var createSingleTicket = function (req, callback) {
    zendesk.tickets.create(req
    ).then(function (result) {
        ticketResult = result;
        return callback(null, result);
    });
}

//update ticket
var updateTicket = function (req, callback) {
    zendesk.tickets.update(req.TICKET_ID, req).then(function (result) {
        return callback(null, result);
    });
}

//Delete ticket
var deleteTicket = function (req, callback) {
    zendesk.tickets.delete(req.TICKET_ID).then(function (result) {
        return callback(null, result);
    });
}

// Show a single ticket 
var showSingleTicket = function (req, callback) {
    zendesk.tickets.show(req).then(function (ticket) {
        return callback(null, ticket);
    });
}

//show list of ticket
var showListTicket = function (req, callback) {
    zendesk.tickets.list().then(function (tickets) {
        return callback(null, tickets);
    });
}

//list all open ticket
var showListAllOpenTicket = function (req, callback) {
    zendesk.search.list(req).then(function (results) {
        return callback(null, results);
    });
}

module.exports = {
    createSingleTicket,
    updateTicket,
    deleteTicket,
    showSingleTicket,
    showListTicket,
    showListAllOpenTicket
}
