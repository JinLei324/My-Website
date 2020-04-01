const errorMsg = require('../../../locales');

let errorMessage = (err, req) => {

    return new Promise((resolve, reject) => {
        let message = '';
        switch (err.type) {
            case 'StripeCardError':
                // A declined card error
                message = err.message; // => e.g. "Your card's expiration year is invalid."
                break;
            case 'RateLimitError':
                // Too many requests made to the API too quickly
                message = getErrorMsg('stripeErr', req)['rateLimit'];
                break;
            case 'StripeInvalidRequestError':
                // Invalid parameters were supplied to Stripe's API
                message = getErrorMsg('stripeErr', req)['invalidParams'];
                break;
            case 'StripeAPIError':
                // An error occurred internally with Stripe's API
                message = getErrorMsg('stripeErr', req)['apiErr'];
                break;
            case 'StripeConnectionError':
                // Some kind of error occurred during the HTTPS communication
                message = getErrorMsg('stripeErr', req)['connectionErr'];
                break;
            case 'StripeAuthenticationError':
                // You probably used an incorrect API key
                message = getErrorMsg('stripeErr', req)['authErr'];
                break;
            default:
                // Handle any other types of unexpected errors
                message = getErrorMsg('stripeErr', req)['defaultErr'];
                break;
        }
        return resolve((err.message || message));
    });
}

function getErrorMsg(message, req){
    if(typeof req == 'undefined'){
        return errorMsg[message];
    } else {
        return req.i18n.__(message);
    }
}

module.exports = {
    errorMessage
};