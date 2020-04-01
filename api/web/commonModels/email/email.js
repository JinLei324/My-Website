var config = process.env;


var cheerio = require('cheerio'); //to extract the html from html files
var ASYNC = require('async');
var fs = require('fs');
const sendMailOffers = require('../../../library/mailgun');
const logger = require('winston');
const rabbitMq = require('../../../library/rabbitMq/rabbitMq');
var pdf = require('html-pdf');
const assignOrders = require('../../../models/assignOrders');
const newOrders = require('../../../models/order');
const unassignOrders = require('../../../models/unassignOrders');
const pickupOrders = require('../../../models/pickupOrders');
const completedOrders = require('../../../models/completedOrders');
var options = {
    "format": 'A4',
    "type": "pdf"
};
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: config.AMAZON_AWS_ACCESS_KEY,
    secretAccessKey: config.AMAZON_AWS_AUTH_SECRET
});

// module.exports = EMAIL = {};
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
let getTemplateAndSendEmail = (params, callback) => {


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


/**
 * Method get the email template from the url, format the email body & send email
 * @param {*} params - templateUrl, keysToReplace ({username: 'Test',..}), toEmail, subject
 */
let generatePdf = (params, callback) => {
    fs.readFile(config.prodEmailTemplateUrl + params.templateName, function (err, body) {


        if (err) return callback(err);

        var $ = cheerio.load(body);
        params.keysToReplace.appName = params.keysToReplace.appName ? params.keysToReplace.appName : config.appName;
        params.keysToReplace.webUrl = params.keysToReplace.webUrl ? params.keysToReplace.webUrl : config.webUrl;
        Object.keys(params.keysToReplace).forEach(key => {
            $('dynamicItems').replaceWith('<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;font-family: "Roboto", sans-serif;"><tr><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Name:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Size:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Price:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;width: 10%;font-size: 9px;text-align: center;text-align: left;font-size: 9px;text-transform: uppercase;">Quantity:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Discount:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Final price:</th></tr>' + params.keysToReplace.dynamicItems + '</table>');
            $('qrCode').replaceWith("<img src=" + params.qrCodeImage + " width='100' height = '100' alt='logo' title='logo' class='logoImg'/>");

            $(key).replaceWith(params.keysToReplace[key]);
            // params.keysToReplace.dynamicItems ? $('dynamicItems').replaceWith('<table border="0" cellspacing="0" cellpadding="0" style="padding-left: 25px;padding-right: 25px;width: 100%;"> <hr style="width:93%"><thead>' + params.keysToReplace.dynamicItems + '</thead></table>') : true;
        });

        let invoiceUrl = '';
        let invoiceAwsUrl = '';
        let genarateAttachment = () => {
            return new Promise((resolve, reject) => {
                if (params.attachment && params.attachment == true) {
                    let pdfFilepath = __dirname + "/../../../../../emailInvoices/";
                    pdf.create($('body').html(), options).toFile(pdfFilepath + params.orderId + '.pdf', function (err, res) {
                        if (err) {
                            logger.error('error while generating invoice PDF : ', err);
                        } else {
                            // let filepath = path.join(pdfFilepath, params.orderId + '.pdf');
                            logger.error('filepath');
                            invoiceUrl = pdfFilepath + params.orderId + '.pdf';
                            //   mailParam.attachment = filepath;
                        }
                        resolve(true);
                    });
                } else {
                    resolve(true);
                }
            });
        };
        let uploadToS3 = () => {
            logger.warn('uploadToS3');
            return new Promise((resolve, reject) => {
                if (params.attachment && params.attachment == true) {
                    logger.warn('uploadToS32');
                    // const uploadFile = () => {
                    fs.readFile(invoiceUrl, (err, data) => {
                        if (err)
                            logger.error('err while reading pdf ', err);
                        const parameters = {
                            Bucket: config.AMAZON_S3_BUCKET_NAME, // pass your bucket name
                            Key: 'invoices/' + params.orderId + '.pdf', // file will be saved as testBucket/contacts.csv
                            Body: data,
                            ContentType: 'application/pdf'
                            //, ACL: 'public-read'
                        };
                        s3.upload(parameters, function (s3Err, data) {
                            if (s3Err)
                                logger.error('err while upload pdf s3', s3Err);
                            invoiceAwsUrl = data.Location;
                            fs.unlink(invoiceUrl, function (err) {
                                if (err)
                                    logger.error('err while unlink image:', err);
                                // if no error, file has been deleted successfully
                                logger.warn('File pdf deleted!');
                                resolve(true);
                            });
                        });
                    });
                    // };
                } else {
                    resolve(true);
                }
            });
        };
        let updateOrderCollection = () => {
            return new Promise((resolvee, reject) => {

                let orderDetails = {};
                var modelName = '';


                const readNewOrder = (newOrder) => {
                    return new Promise((resolve, reject) => {
                        newOrders.isExistsWithOrderId({ orderId: parseFloat(params.orderId) }, (err, res) => {
                            orderDetails = res ? res : orderDetails;
                            modelName = res ? newOrders : modelName;
                            return err ? reject(err) : resolve(orderDetails);
                        });
                    });
                }
                const readUnassignOrder = (newOrder) => {
                    return new Promise((resolve, reject) => {
                        unassignOrders.isExistsWithOrderId({ orderId: parseFloat(params.orderId) }, (err, res) => {
                            orderDetails = res ? res : orderDetails;
                            modelName = res ? unassignOrders : modelName;
                            return err ? reject(err) : resolve(orderDetails);
                        });
                    });
                }
                const readAssignOrder = (newOrder) => {
                    return new Promise((resolve, reject) => {
                        assignOrders.isExistsWithOrderId({ orderId: parseFloat(params.orderId) }, (err, res) => {
                            orderDetails = res ? res : orderDetails;
                            modelName = res ? assignOrders : modelName;
                            return err ? reject(err) : resolve(orderDetails);
                        });
                    });
                }
                readNewOrder().then(readUnassignOrder).then(readAssignOrder).then(data => {
                    if (Object.keys(data).length > 0) {
                        modelName.patchOrderData({ condition: { orderId: parseFloat(params.orderId) }, data: { invoicePdfUrl: invoiceAwsUrl } }, (err, res) => {
                            return err ? reject(err) : resolvee(true);
                        });
                    } else {
                        return resolvee(true);
                    }

                });

            });
        };
        genarateAttachment().then(uploadToS3).then(updateOrderCollection).then(result => {
            logger.warn('invoiceAwsUrl ', invoiceAwsUrl)
            return callback(null, 'sent');
        }).catch((err) => {
            logger.warn('error catch email ', err)
            return callback(null, 'sent');
        });

        return callback(null, 'sent');
    });

};



/**
 * Method get the email template from the url, format the email body & send email
 * @param {*} params - templateUrl, keysToReplace ({username: 'Test',..}), toEmail, subject
 */
let generatePdfInvoice = (params, callback) => {
    fs.readFile(config.prodEmailTemplateUrl + params.templateName, function (err, body) {


        if (err) return callback(err);

        var $ = cheerio.load(body);
        params.keysToReplace.appName = params.keysToReplace.appName ? params.keysToReplace.appName : config.appName;
        params.keysToReplace.webUrl = params.keysToReplace.webUrl ? params.keysToReplace.webUrl : config.webUrl;
        Object.keys(params.keysToReplace).forEach(key => {
            $('dynamicItems').replaceWith('<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;font-family: "Roboto", sans-serif;"><tr><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Name:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Size:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Price:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;width: 10%;font-size: 9px;text-align: center;text-align: left;font-size: 9px;text-transform: uppercase;">Quantity:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Discount:</th><th class="textTransformUpCls" style="border-bottom: 1px solid #9a9a9a;text-align: left;font-size: 9px;text-transform: uppercase;">Final price:</th></tr>' + params.keysToReplace.dynamicItems + '</table>');
            $('qrCode').replaceWith("<img src=" + params.qrCodeImage + " width='100' height='100' alt='logo' title='logo' class='logoImg'/>");

            $(key).replaceWith(params.keysToReplace[key]);
            // params.keysToReplace.dynamicItems ? $('dynamicItems').replaceWith('<table border="0" cellspacing="0" cellpadding="0" style="padding-left: 25px;padding-right: 25px;width: 100%;"> <hr style="width:93%"><thead>' + params.keysToReplace.dynamicItems + '</thead></table>') : true;
        });

        let invoiceUrl = '';
        let invoiceAwsUrl = '';
        let genarateAttachment = () => {
            return new Promise((resolve, reject) => {
                if (params.attachment && params.attachment == true) {
                    let pdfFilepath = __dirname + "/../../../../../emailInvoices/";
                    pdf.create($('body').html(), options).toFile(pdfFilepath + params.orderId + '.pdf', function (err, res) {
                        if (err) {
                            logger.error('error while generating invoice PDF : ', err);
                        } else {
                            // let filepath = path.join(pdfFilepath, params.orderId + '.pdf');
                            logger.error('filepath');
                            logger.error(res);
                            invoiceUrl = pdfFilepath + params.orderId + '.pdf';
                            //   mailParam.attachment = filepath;
                        }
                        resolve(true);
                    });
                } else {
                    resolve(true);
                }
            });
        };
        let uploadToS3 = () => {
            logger.warn('uploadToS3');
            return new Promise((resolve, reject) => {
                if (params.attachment && params.attachment == true) {
                    logger.warn('uploadToS32');
                    // const uploadFile = () => {
                    fs.readFile(invoiceUrl, (err, data) => {
                        if (err)
                            logger.error('err while reading pdf ', err);
                        const parameters = {
                            Bucket: config.AMAZON_S3_BUCKET_NAME, // pass your bucket name
                            Key: 'invoicesData/' + params.orderId + '.pdf', // file will be saved as testBucket/contacts.csv
                            Body: data,
                            ContentType: 'application/pdf'
                            //, ACL: 'public-read'
                        };
                        s3.upload(parameters, function (s3Err, data) {
                            if (s3Err)
                                logger.error('err while upload pdf s3', s3Err);
                            invoiceAwsUrl = data.Location;
                            fs.unlink(invoiceUrl, function (err) {
                                if (err)
                                    logger.error('err while unlink image:', err);
                                // if no error, file has been deleted successfully
                                logger.warn('File pdf deleted!');
                                resolve(true);
                            });
                        });
                    });
                    // };
                } else {
                    resolve(true);
                }
            });
        };
        let updateOrderCollection = () => {
            return new Promise((resolvee, reject) => {

                let orderDetails = {};
                var modelName = '';

                const readCompletedOrder = (newOrder) => {
                    return new Promise((resolve, reject) => {
                        completedOrders.isExistsWithOrderId({ orderId: parseFloat(params.orderId) }, (err, res) => {
                            orderDetails = res ? res : orderDetails;
                            modelName = res ? completedOrders : modelName;
                            return err ? reject(err) : resolve(orderDetails);
                        });
                    });
                }
                readCompletedOrder().then(data => {
                    if (Object.keys(data).length > 0) {

                        modelName.patchOrderData({ condition: { orderId: parseFloat(params.orderId) }, data: { invoiceUrl: invoiceAwsUrl } }, (err, res) => {
                            return err ? reject(err) : resolvee(true);
                        });

                    } else {
                        return resolvee(true);
                    }

                });

            });
        };
        genarateAttachment().then(uploadToS3).then(updateOrderCollection).then(result => {
            logger.warn('invoiceAwsUrl ', invoiceAwsUrl)
            return callback(null, 'sent');
        }).catch((err) => {
            logger.warn('error catch email ', err)
            return callback(null, 'sent');
        });

        return callback(null, 'sent');
    });

};
module.exports = { generatePdfInvoice, generatePdf, getTemplateAndSendEmail };
