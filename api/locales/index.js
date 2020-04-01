const config = require('../config/components/localization')
let defaultLan = config.localization.DEFAULT_LANGUAGE;

module.exports =  require(`./${defaultLan}.json`);