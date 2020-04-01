var config = process.env;


var cheerio = require('cheerio'); //to extract the html from html files
var ASYNC = require('async');
var fs = require('fs');
const sendMailOffers = require('../../../library/mailgun');
const logger = require('winston');
const rabbitMq = require('../../../library/rabbitMq/rabbitMq');

module.exports = EMAIL = {};
/**
 * Method to send an email from mailgun api
 * @param {*} params - to, subject
 * @param {*} body - email body
 */
function sendMail(params, body) {

    if (params.trigger == "offers") {

        let paramOffers = {
            
            from: "" + config.appName + " <" + config.emailsFromEmail + ">",
            
            to: params.to || "",
            
            subject: params.subject || '',
            
            html: body,
            
            trigger: params.trigger
        }

        sendMailOffers.sendMail(paramOffers, (err, res) => {
            
            if (res) {
                logger.info("sendMail success");
            } else {
                logger.info("sendMail error")
            }
        });

    } else {

        let param = {
            from: "" + config.appName + " <" + config.emailsFromEmail + ">",
            email: params.to || '',
            subject: params.subject || '',
            body: body,
            trigger: params.trigger
        }

        
        rabbitMq.sendToQueue(rabbitMq.queueEmail, param, (err, doc) => {
        });
    }

}



/**
 * Method get the email template from the url, format the email body & send email
 * @param {*} params - templateUrl, keysToReplace ({username: 'Test',..}), toEmail, subject
 */
EMAIL.getTemplateAndSendEmail = (params, callback) => {


    fs.readFile(config.prodEmailTemplateUrl + params.templateName, function (err, body) {


        if (err) return callback(err);

        var $ = cheerio.load(body);
        params.keysToReplace.appName = params.keysToReplace.appName ? params.keysToReplace.appName : config.appName;
        params.keysToReplace.webUrl = params.keysToReplace.webUrl ? params.keysToReplace.webUrl : config.webUrl;
        Object.keys(params.keysToReplace).forEach(key => {
            $(key).replaceWith(params.keysToReplace[key]);
            
            
            params.keysToReplace.dynamicItems ? $('dynamicItems').replaceWith('<table border="0" cellspacing="0" cellpadding="0" style="padding-left: 25px;padding-right: 25px;width: 100%;"> <hr style="width:93%"><thead>' + params.keysToReplace.dynamicItems + '</thead></table>') : true;
        });

        sendMail({
            fromName: config.emailsFromName,
            from: config.emailsFromEmail,
            to: params.toEmail,
            subject: params.subject,
            trigger: params.trigger
        }, $('body').html());

        return callback(null, 'sent');
    });
}