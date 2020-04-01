'use strict'

const logger = require('winston');
const db = require('../../library/mongodb')
let tablename = 'can_reason';//collection name

 
/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tablename).find(params).sort({ '_id': 1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
module.exports = {   read };
