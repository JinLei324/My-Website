'use strict'

const path = require('path');
const fork = require('child_process').fork;
let logger = require('winston');
const numCPUs = require("os").cpus().length;
const find = require('find-process');

let newBooking = {
    name: "New Booking",
    path: path.join(__dirname, '../../worker/dispatch/newBookingQueue'),
    worker: null,
    flag: true
};

let retryBooking = {
    name: "Retry Booking",
    path: path.join(__dirname, '../../worker/dispatch/retryQueue'),
    worker: null,
    flag: true
};

let email = {
    name: "Email",
    path: path.join(__dirname, '../../worker/email/worker.js'),
    worker: null,
    flag: true
};

let ticket = {
    name: "ZenDesk Ticket",
    path: path.join(__dirname, '../../worker/zendeskInsert/worker.js'),
    worker: null,
    flag: true
};

let sms = {
    name: "SMS",
    path: path.join(__dirname, '../../worker/twilio/worker.js'),
    worker: null,
    flag: true
};

let stripeEvent = {
    name: "Stripe Event",
    path: path.join(__dirname, '../../worker/stripe/stripeEventWorker'),
    worker: null,
    flag: true
};

let messages = {
    name: "MQTT Chat Message",
    path: path.join(__dirname, '../../worker/messages/worker.js'),
    worker: null,
    flag: true
};
let promoCampaignUtility = {
    name: "Promo Campaign Utility",
    path: path.join(__dirname, '../../worker/promoCampaigns/worker'),
    worker: null,
    flag: true
};

let referralCampaignUtility = {
    name: "Referal Campaign Utility",
    path: path.join(__dirname, '../../worker/referralCampaignsWorker/worker'),
    worker: null,
    flag: true
};


let queueMasterLocation = {
    name: "Master Location",
    path: path.join(__dirname, '../../worker/dispatch/masterLocationUpdateWorker'),
    worker: null,
    flag: true
};

let QueueBulkimportInsert = {
    name: "QueueBulkimportInsert",
    path: path.join(__dirname, '../../worker/bulkImport/worker.js'),
    worker: null,
    flag: true
};
function startWorkerProcess(workerData) {
    find('name', workerData.path, false)
        .then(function (list) {
            logger.debug('there are %s %s process(es)', JSON.stringify(list.length), workerData.path);
            if (list.length < numCPUs) {
                workerData.worker = fork(workerData.path);
                workerData.worker.on('exit', function (code, signal) {
                    logger.error(`${workerData.name} worker exited with code ${code} and signal ${signal}`);
                    workerData.worker = null;
                    if (workerData.flag) {
                        // if (workerData.alwaysRun)
                        startWorkerProcess(workerData);
                    }
                });
            } else {
                logger.warn(`${workerData.name} worker is already running`);
            }
        });
}

function stopWorkerProcess(workerData) {
    if (workerData.worker == null) {
        logger.warn(`${workerData.name} worker is not running`);
    } else {
        workerData.flag = false;
        workerData.worker.kill();
        workerData.worker = null;
    }
}

function startWorker() {
    startWorkerProcess(newBooking);
    startWorkerProcess(retryBooking);
    startWorkerProcess(QueueBulkimportInsert);
    // startWorkerProcess(queueMasterLocation);
    // startWorkerProcess(email);
    // startWorkerProcess(ticket);
    // startWorkerProcess(sms);
    // startWorkerProcess(stripeEvent);
    // startWorkerProcess(messages);
    // startWorkerProcess(promoCampaignUtility);
    // startWorkerProcess(referralCampaignUtility);
}

function checkWorker(queue) {
    startWorkerProcess(queue.worker);
}

// //catches uncaught exceptions
// process.on('uncaughtException', function (err, code, signal) {
//     logger.error(`worker exited with ` + `code ${code} and signal ${signal}`, err);
//     exitHandler();
// });

module.exports = {
    checkWorker,
    startWorker,
    newBooking,
    retryBooking,
    email,
    ticket,
    sms,
    stripeEvent,
    messages,
    promoCampaignUtility,
    referralCampaignUtility,
    queueMasterLocation,
    QueueBulkimportInsert
};