'use strict'

const logger = require('winston');
const db = require('../../library/mongodb')
let tablename = 'RatingParams';//collection name


/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tablename).find(params, { name: 1, attributes: 1, associated: 1, associatedMsg: 1 }).sort({ 'seqId': 1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
module.exports = { read };
