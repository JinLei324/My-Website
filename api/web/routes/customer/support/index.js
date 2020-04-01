'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');
/** @namespace */
const support = require('./get');

module.exports = {
    method: 'GET',
    path: '/customer/support',
    config: {
        tags: ['api', 'customer'],
        description: 'Get support data',
        notes: 'Api to get support data',
        auth: false,
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('supportReview')['200']),
                    data: Joi.any().example([{
                        "name": "Cancellation & Returns ",
                        "subcat": [{
                            "name": "How can I cancel my order?",
                            "desc": "<p>Flexy provides easy and hassle-free cancellation. You can cancel your order via the app or web before it is dispatched to your home. This option is available under the &ldquo;My Orders&rdquo; tab in &ldquo;View Details&rdquo;.<br />\r\n<strong>Please note:&nbsp;</strong>Once the order is packed, the merchant may levy a fee &nbsp;if an order is canceled by the customer.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/1/5b7ac024f801686e296b943a/en"
                        }, {
                            "name": "What If I want to return something?",
                            "desc": "<p>If you&rsquo;re dissatisfied with the products delivered, please register a complaint via the app within 48 hours for non-perishable items and 24 hours for perishable items. Our customer support team will get in touch with you to resolve this issue.You can also return the products which you are dissatisfied with, at the time of delivery and we will get the refund initiated for you.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/1/5b7ac070f801686e31123eb7/en"
                        }, {
                            "name": "Can I reschedule my order?",
                            "desc": "<p>Yes, you can do this by clicking on the Need Help option in &ldquo;My Orders&rdquo; section. You can also reschedule your order as per your convenience basis the slots available, provided the order is not already en route.<br />\r\n<strong>Please note:</strong>&nbsp;Once the order is packed, the merchant may levy a fee&nbsp;if an order is rescheduled by the customer.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/1/5b7ac0eaf801686e296b943b/en"
                        }, {
                            "name": "What if I have any complaint regarding my order?",
                            "desc": "<p>You can use the &ldquo;Contact Us&rdquo; section on the app/web. Our customer care executives are always happy to help.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/1/5b7ac10af801687075535ee6/en"
                        }],
                        "desc": "",
                        "link": "https://superadmin.flexyapp.com/index.php?/utilities/getDescription/1/en"
                    }, {
                        "name": "Placing an order",
                        "subcat": [{
                            "name": "How will I know if any item in my order is unavailable?",
                            "desc": "<p>You will receive an SMS notification informing you about the unavailable items in this situation. Refund (if any) will also be initiated within 24 hours.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/2/5b7ac138f801687075535ee7/en"
                        }, {
                            "name": "Is it safe to use my debit/credit card to shop on Flexy?",
                            "desc": "<p>Yes, it is. All transactions on Flexy are completed via secure payment gateways (Citrus, PayU) which are PCI and DSS compliant. We do not store your card details at any given time.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/2/5b7ac16cf801686e31123eb9/en"
                        }, {
                            "name": "I’m trying to place an order today but it is getting scheduled for the next day. What can I do?",
                            "desc": "<p>Depending on store timings and store capacities, your order may be scheduled for a different day.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/2/5b7ac19bf801687075535ee8/en"
                        }],
                        "desc": "",
                        "link": "https://superadmin.flexyapp.com/index.php?/utilities/getDescription/2/en"
                    }, {
                        "name": "Delivery related queries",
                        "subcat": [{
                            "name": "Do you charge for delivery?",
                            "desc": "<p>Every store has its own delivery charges, which are waived off if you order above a specified minimum amount from the store. The minimum charges and the delivery charges are mentioned on the app and web at the checkout page.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/3/5b7ac1bbf801686e296b943d/en"
                        }, {
                            "name": "What are your delivery times?",
                            "desc": "<p>In some locations, our deliveries begin from 6AM and the last delivery is completed by 11PM.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/3/5b7ac1dbf801687075535ee9/en"
                        }, {
                            "name": "Can I change the delivery address of my order?",
                            "desc": "<p>At this time, we do not offer this option. You can, however, cancel your order and reorder from a different locality.</p>\r\n",
                            "link": "https://superadmin.flexyapp.com/index.php?/utilities/getsubDescription/3/5b7ac1f5f801686e31123eba/en"
                        }],
                        "desc": "",
                        "link": "https://superadmin.flexyapp.com/index.php?/utilities/getDescription/3/en"
                    }, {
                        "name": "test",
                        "subcat": [],
                        "desc": "<p>test</p>\r\n",
                        "link": "https://superadmin.flexyapp.com/index.php?/utilities/getDescription/11/en"
                    }])
                },
                404: {
                    message: Joi.any().default(i18n.__('supportReview')['404'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }

    },
    handler: support.handler
}