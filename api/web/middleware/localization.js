const config = require('../../config/components/localization');
const defaultLan = config.localization.DEFAULT_LANGUAGE;
const languages = config.localization.LANGUAGES;

const i18n = {
    register: require('hapi-i18n'),
    options: {
        locales: languages.split(','),
        directory: './locales',
        languageHeaderField: 'language',
        defaultLocale: defaultLan
    }
}

module.exports = { i18n };