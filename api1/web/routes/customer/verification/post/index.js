
/** @namespace */
const sendOtp = require('./send');
/** @namespace */
const verifyOtp = require('./verifyOtp');


module.exports = [ 
  
].concat(sendOtp,verifyOtp);