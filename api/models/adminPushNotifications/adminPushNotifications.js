'use strict'

const logger = require('winston');
const db = require('../../library/mongodb')
let tablename = 'adminPushNotifications';//collection name

const post = (data, callback) => {
    db.get().collection(tablename).insert([data], (err, result) => {
        return callback(err, result);
    });
}//insert email log in db 
module.exports = { post  };
