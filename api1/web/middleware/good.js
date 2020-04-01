/**
 * good module.
 * @module good
 * @see module:good
 */
const good = {
    register: require("good"),
    options: {
        reporters: {
            myConsoleReporter:
            [
                { module: 'good-console' },
                'stdout'
            ]
        }
    }
}

module.exports = good;