'use strict'
const sf = require('node-salesforce');
const logger = require('winston');
var authCreds = {
    accessToken: "",
    instanceUrl: ""
    //refreshToken: ""

};

exports.login = (callback) => {
    var username = "groccer@appscrip.com";
    var password = "Appscrip@123nMhsg8Sw4uAG1QHashWpEiOt";
    var conn = new sf.Connection({
        oauth2: {
            // you can change loginUrl to connect to sandbox or prerelease env.
            loginUrl: 'https://login.salesforce.com',
            clientId: '3MVG9ZF4bs_.MKujsCnh94AWCYJ9VVg5vCC5txWpRXM03eC3nhaVKkyP2LzuqqSmpU288emlwqcDlpFTnUoQT',
            clientSecret: '4BBCA77A48F809D04D78CFF9A7DAD52FDA1807E2FB28CEBFF6DEC3DA52E7C28E',
            redirectUri: 'https://groceer-appscrip-dev-ed.my.salesforce.com/services/oauth2/callback'
        }
    });//https://manishappscrip-dev-ed.my.salesforce.com/services/oauth2/callback


    // if (authCreds.accessToke && authCreds.instanceUrl) return callback();

    conn.login(username, password, function (err, userInfo) {
        if (err) {
            logger.warn('Error in connection', err);
            logger.warn('Salesforce username =' + username);
            logger.warn('Salesforce password =' + password);
            return callback(err);
        }
        logger.warn('SalesForce api connected');
        logger.warn('SalesForce access Token =', conn.accessToken, ' and SalesForceinstanceUrl ', conn.instanceUrl);
        // Now you can get the access token and instance URL information.
        // Save them to establish connection next time.
        authCreds.accessToken = conn.accessToken;
        authCreds.instanceUrl = conn.instanceUrl;
        //authCreds.refreshToken = conn.refreshToken;

        return callback();
    });
}
exports.get = () => { return authCreds }