'use strict'

const logger = require('winston');
const db = require('../../library/mongodb')
let tablename = 'emailLog';//collection name

const Insert = (data, callback) => {
    db.get().collection(tablename).insert([data], (err, result) => {
        return callback(err, result);
    });
}//insert email log in db
/** 
 * @function
 * @name updateByMsgId 
 * @param {object} queryObj - data coming from controller
 */
const updateByMsgId = (queryObj, callback) => {
    db.get().collection(tablename).findOneAndUpdate({ msgId: queryObj['Message-Id'] }, {
        $set: {
            status: queryObj.event
        }
    }, ((err, result) => {
        return callback(err, result);
    }));
}//update mail status by msgid
/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tablename).find({}).sort({ '_id': -1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
module.exports = { Insert, updateByMsgId, read };
