'use strict'

const referralCampiagns = require('./referralCampaigns');
const referralCode = require('./referralCode');

module.exports = [].concat(referralCampiagns,
                             referralCode
                    );
