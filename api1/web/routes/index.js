const admin = require('./admin');
const business = require('./business');
const campaignAndreferral = require('./campaignAndreferral');
const category = require('./categories');
const chatModule = require('./chat');
const cronJobTrigger = require('./cronJobTrigger');
const customer = require('./customer');
const dispatcher = require('./dispatcher');
const driver = require('./driver');
const franchise = require('./franchise');
const franchiseDispatcher = require('./franchiseDispatcher');
const imageUpload = require('./imageUpload');
const laundry = require('./laundry');
const payoff = require('./payoff');
const pos = require('./pos');
const SalesforceLivetrack = require('./Salesforce');
const search = require('./search');
const staff = require('./staff');
const storeDispatcher = require('./storeDispatcher');
const stripe = require('./stripe');
const turf = require('./turf');
const utility = require('./utility');
const wallet = require('./wallet');
const webhooks = require('./webhooks');
const zendesk = require('./zendesk');
const keyRotation = require('./keyRotation');


module.exports = [].concat(
    admin,
    business,
    campaignAndreferral,
    category,
    chatModule,
    cronJobTrigger,
    customer,
    dispatcher,
    driver,
    franchise,
    franchiseDispatcher,
    imageUpload,
    laundry,
    payoff,
    pos,
    SalesforceLivetrack,
    search,
    staff,
    storeDispatcher,
    stripe,
    turf,
    utility,
    wallet,
    webhooks,
    zendesk,
    keyRotation
);
