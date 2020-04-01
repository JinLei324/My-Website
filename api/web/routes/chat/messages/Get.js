'use strict'
const Joi = require("joi");
const logger = require('winston');
const messageDB = require('../../../../models/messageDB');

let handler = (req, res) => {

    let pageNo = parseInt(req.params.pageNo);
    let skip = pageNo * 10;
    let limit = skip + 20;
    let condition = { bid: req.params.bookingId };

    messageDB.SelectWithSort(condition, { timestamp: -1 }, {}, skip, limit, (err, result) => {
        return (err) ? res({ message: "internal server error" }).code(500) : ((result[0]) ?
            res({ message: "Data found", data: result }).code(200) : res({ message: "No Data found" }).code(200));
    });
};

let validator = Joi.object({
    bookingId: Joi.string().required().description("bookingId").error(new Error('bookingId is missing')),
    pageNo: Joi.string().required().description("pageNo").error(new Error('pageNo is missing || invalid it should be integer eg. 0 || 1 || 2 || ..... '))
})

module.exports = { handler, validator }