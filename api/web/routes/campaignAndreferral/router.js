'use strict';


const customer = require('./customer');  
const admin = require('./admin'); 
const claims = require('./claims'); 
const promoCode = require('./promoCode'); 
// const wallet = require('./wallet'); 
const referralCampaigns = require('./referralCampaigns');
const promoCampaign = require('./promoCampaign'); 
const logs = require('./logs'); 
const validatePromoCampaign = require('./validatePromoCampaign');


module.exports = [].concat(
    admin,
    claims,
    promoCampaign,
    validatePromoCampaign,
    referralCampaigns,
    promoCode,
    logs,
    customer
);