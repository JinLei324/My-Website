
const referralCampaigns = require('../../../../models/referralCampaigns/referralCampaigns');
const appConfig = require('../../../../models/appConfig');

const handler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let referralCampaignData = {};
    let appConfigData = {};

    const getAppConfigration = () => {
        return new Promise((resolve, reject) => {
            appConfig.getAppConfigration()
                .then((result) => {
                    appConfigData = result;
                    resolve(true);
                })
                .catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    const getReferralCampaignDetail = () => {
        return new Promise((resolve, reject) => {
            let campaignData = {
                'cityId': req.user.cityId.toString(),
                'zoneId': "",
                'isoDate': new Date().toISOString()
            };
            referralCampaigns.validateReferral(campaignData, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else if (result.length === 0) {
                    return resolve(true);
                } else {
                    referralCampaignData = result;
                    return resolve(true);
                }
            });
        });
    };

    getAppConfigration()
        .then(getReferralCampaignDetail)
        .then(data => {
            if (req.user.referralCode == null && req.user.referralCode == "") {
                return reply({ message: "Referral code not found" }).code(402);
            } else {
                let title = "";
                if (referralCampaignData && Array.isArray(referralCampaignData) && referralCampaignData.length > 0) {
                    title = referralCampaignData[0].title || "";
                }
                let shareTextMessage = "";
                if (appConfigData.refferalShareCodeText && appConfigData.refferalShareCodeText[req.i18n.getLocale()]) {
                    shareTextMessage = appConfigData.refferalShareCodeText[req.i18n.getLocale()]
                }
                shareTextMessage = shareTextMessage.replace("%s", req.user.referralCode)
                shareTextMessage = shareTextMessage.replace("%S", req.user.referralCode)
                let data = {
                    "referralCode": req.user.referralCode,
                    "title": title,
                    "shareTextMessage": shareTextMessage
                }
                return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
            }
        }).catch(e => {
            logger.error("Customer get reffral code API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });

}
const responseCode = {
    // status: {
    // 200: { message: Joi.any().default(i18n.__('genericErrMsg')['200'])[error['lang']], data: joi.any() },
    //     400: { message: error['postReferralCodeValidation']['400'][error['lang']] },
    //     401: { message: error['postReferralCodeValidation']['401'][error['lang']] },
    //     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'])[error['lang']] }
    // }

}

module.exports = {
    handler,
    responseCode
};