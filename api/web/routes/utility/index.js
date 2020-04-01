const languages = require('./languages');
const resetPassword = require('./resetPassword');
const validateResetLink = require('./validateResetLink');

module.exports = [].concat(
    languages,
    resetPassword,
    validateResetLink
);