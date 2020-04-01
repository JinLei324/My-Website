'use strict'

const joi = require('joi')
const logger = require('winston');
var fs = require('fs');

const config = require('../../config/components/stripe');
var stripeSecreteKey = config.stripe.STRIPE_SECRET_KEY;
var stripeMode = config.stripe.STRIPE_MODE;
var stripe = require('stripe')(stripeSecreteKey);//create an instance of stripe with the secretkey

// // Add the event handler function for request
// function onRequest(request) {
// }
// stripe.on('request', onRequest);

// // Add the event handler function for response
// function onResponse(response) {
// }
// stripe.on('response', onResponse);

var STRIPE = module.exports = {};//export the module

/**
 * Method to add a new customer
 * @param {*} params - email
 * @param {*} cb - callback
 */
STRIPE.createCustomer = (params, cb) => {
    stripe.customers.create({
        email: params.email
    }, (err, customer) => {
        return cb(err, customer);
    });
};

/**
 * Method to update the customer details (set a default card)
 * @param {*} params - id, cardId
 * @param {*} cb - callback
 */
STRIPE.updateCustomer = (params, cb) => {
    stripe.customers.update(params.id, {
        default_source: params.cardId
    }, (err, customer) => {
        return cb(err, customer)
    });
};

/**
 * Method to retrieve the customer details
 * @param {*} id - the stripe's customerId
 * @param {*} cb - callback
 */
STRIPE.retrieveCustomer = (id, cb) => {
    stripe.customers.retrieve(id, (err, customer) => {
        return cb(err, customer)
    });
};

/**
 * Method to add a new card of a customer
 * @param {*} params - {id, cardToken}
 * @param {*} cb - callback
 */
STRIPE.addCard = (params, cb) => {
    stripe.customers.createSource(
        params.id,
        {
            // source: {
            //     object: 'card',
            //     name: params.name,
            //     exp_month: params.exp_month,
            //     exp_year: params.exp_year,
            //     number: params.number,
            //     cvc: params.cvc
            // }
            source: params.cardToken
        },
        (err, card) => {
            return cb(err, card)
        });
};

/**
 * Method to get all the cards of a customer
 * @param {*} id - the stripe's customerId
 * @param {*} cb - callback
 */
STRIPE.getCards = (id, cb) => {
    stripe.customers.listCards(id, (err, cards) => {
        return cb(err, cards);
    });
};

/**
 * Method to delete a card from the customers' stripe account
 * @param {*} customerId - the stripe's customerId
 * @param {*} cardId - the id of the card to delete
 * @param {*} cb - callback
 */
STRIPE.deleteCard = (customerId, cardId, cb) => {
    stripe.customers.deleteCard(
        customerId,
        cardId,
        (err, confirmation) => {
            return cb(err, confirmation);
        }
    );
};

/**
 * Method to create a charge on a customer's card
 * @param {*} params - amount, currency, description, customer, card, capture(true || false)
 * @param {*} cb - callback
 */
STRIPE.createCharge = (params, cb) => {
    stripe.charges.create(params, (err, charge) => {
        return cb(err, charge)
    });
};

/**
 * Method to retrieve the charge details
 * @param {*} id - chargeId
 * @param {*} cb - callback
 */
STRIPE.retrieveCharge = (id, cb) => {
    stripe.charges.retrieve(id, (err, charge) => {
        return cb(err, charge)
    });
};

/**
 * Method to capture a charge
 * @param {*} chargeId - Charge ID
 * @param {*} captureData - amount
 * @param {*} cb - callback
 */
STRIPE.capture = (chargeId, captureData, cb) => {
    stripe.charges.capture(chargeId, captureData, (err, charge) => {
        return cb(err, charge)
    });
};

/**
 * Method to refund the uncaptured charge
 * @param {*} refundData - charge, amount
 * @param {*} cb - callback
 */
STRIPE.refundCharge = (refundData, cb) => {
    stripe.refunds.create(refundData, (err, refund) => {
        return cb(err, refund)
    });
};

/**
 * Method to create a new stripe account
 * @param {*} params - type, country, email
 * @param {*} cb - callback
 */
STRIPE.createAccount = (params, cb) => {
    stripe.accounts.create({
        type: params.type || 'standard',
        country: params.country || 'US',
        email: params.email
    }, (err, account) => {
        return cb(err, account)
    });
};

/**
 * Method to retrieve the stripe account
 * @param {*} id - account id
 * @param {*} cb - callback
 */
STRIPE.retrieveAccount = (id, cb) => {
    stripe.accounts.retrieve(id, (err, account) => {
        return cb(err, account)
    });
};

/**
 * Method to update the stripe account
 * @param {*} id - account id
 * @param {*} cb - callback
 */
STRIPE.updateAccount = (id, params, cb) => {
    stripe.accounts.update(id, params, (err, account) => {
        return cb(err, account)
    });
};

/**
 * Method to upload a identity document to the stripe
 * @param {*} fileName - name of the file to upload
 * @param {*} cb - callback
 */
STRIPE.uploadFile = (fileName, cb) => {
    var fp = fs.readFileSync('./temp/' + fileName);

    stripe.fileUploads.create({
        purpose: 'identity_document',
        file: {
            data: fp,
            name: fileName,
            type: 'image/jpeg'
        }
    }, function (err, fileUpload) {
        return cb(err, fileUpload)
    });
};

/**
 * Method to add a bankAccount to the stripe account
 * @param {*} id - stripeAccountId
 * @param {*} params - account_number, routing_number, account_holder_name, country
 * @param {*} cb - callback
 * @link - https://stripe.com/docs/api/node#account_create_bank_account
 */
STRIPE.addBankAccount = (id, params, cb) => {
    params.object = 'bank_account';
    stripe.accounts.createExternalAccount(id, { external_account: params }, (err, bankAccount) => {
        return cb(err, bankAccount)
    });
};

/**
 * Method to update the bankAccount details
 * @param {*} accountId - stripe accountId
 * @param {*} bankAccountId
 * @param {*} params - default_for_currency, metadata
 * @param {*} cb - callback
 * @link - https://stripe.com/docs/api/node#account_update_bank_account
 */
STRIPE.updateBankAccount = (accountId, bankAccountId, params, cb) => {
    stripe.accounts.updateExternalAccount(accountId, bankAccountId, params, (err, bank_account) => {
        return cb(err, bank_account)
    });
};

/**
 * Method to delete a bankAccount from the stripe account
 * @param {*} accountId - stripe accountId
 * @param {*} bankAccountId
 * @param {*} cb - callback
 * @link - https://stripe.com/docs/api/node#account_delete_bank_account
 */
STRIPE.deleteBankAccount = (accountId, bankAccountId, cb) => {
    stripe.accounts.deleteExternalAccount(accountId, bankAccountId, (err, confirmation) => {
        return cb(err, confirmation)
    });
};

/**
 * Method to transfer the amount from the platform account(app account) 
 * to connected account(masters/providers)
 * @param {*} params - amount, currency("usd" - three letters), destination
 * @param {*} cb - callback
 * @link - https://stripe.com/docs/api#create_transfer
 */
STRIPE.transferToConnectAccount = (params, cb) => {
    stripe.transfers.create(params, (err, transfer) => {
        return cb(err, transfer);
    });
}

/**
 * retrieve stripe event
 * @param {*} eventId - Event Id of Stripe Event
 * @param {*} cb - Callback
 */
STRIPE.retrieveEvent = (eventId, cb) => {
    stripe.events.retrieve(eventId, function (err, event) {
        // asynchronously called
        return cb(err, event);
    });
}

/**
 * Create Plan Stripe
 * @param {*} params - {id, name, statement_descriptor, amount, interval, interval_count, currency, metadata}
 * @param {*} cb  - Callback
 */
STRIPE.createPlan = (params, cb) => {
    stripe.plans.create(params, function (err, plan) {
        // asynchronously called
        return cb(err, plan);
    });
}

/**
 * Update Plan Stripe
 * @param {*} planId - plan id to update
 * @param {*} params - {name, statement_descriptor, metadata}
 * @param {*} cb - Callback
 */
STRIPE.updatePlan = (planId, params, cb) => {
    stripe.plans.update(planId, params, function (err, plan) {
        // asynchronously called
        return cb(err, plan);
    });
}

/**
 * Delete Plan Stripe
 * @param {*} planId - plan id to update
 * @param {*} cb - Callback
 */
STRIPE.deletePlan = (planId, cb) => {
    stripe.plans.del(planId, function (err, plan) {
        // asynchronously called
        return cb(err, plan);
    });
}

/**
 * Create Subscription for Customer
 * @param {*} subscriptionData - Subscription Data like customer, plan, billing, etc.
 * @param {*} cb - Callback
 */
STRIPE.createSubscription = (subscriptionData, cb) => {
    stripe.subscriptions.create(subscriptionData, function (err, subscription) {
        // asynchronously called
        return cb(err, subscription);
    });
}

/**
 * Get Subscription Data for Customer
 * @param {*} subscriptionId - Subscription Id
 * @param {*} cb - Callback
 */
STRIPE.retrieveSubscription = (subscriptionId, cb) => {
    stripe.subscriptions.retrieve(subscriptionId, function (err, subscription) {
        // asynchronously called
        return cb(err, subscription);
    });
}

/**
 * Update Subscription Data for Customer
 * @param {*} subscriptionId - Subscription Id
 * @param {*} subscriptionData - Subscription Data like billing, days_until_due, tax_percent, etc.
 * @param {*} cb - Callback
 */
STRIPE.updateSubscription = (subscriptionId, subscriptionData, cb) => {
    stripe.subscriptions.update(subscriptionId, subscriptionData, function (err, subscription) {
        // asynchronously called
        return cb(err, subscription);
    });
}

/**
 * Delete Subscription for Customer
 * @param {*} subscriptionId - Subscription Id
 * @param {*} cb - Callback
 */
STRIPE.deleteSubscription = (subscriptionId, cb) => {
    stripe.subscriptions.del(subscriptionId, function (err, subscription) {
        // asynchronously called
        return cb(err, subscription);
    });
}