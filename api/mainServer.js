'use strict'
//load .env in local development
require('dotenv').config({ path: '/usr/etc/.env', silent: true });

const logger = require('winston');
const semver = require('semver');
const pkg = require('./package.json');
const config = require('./config');
// validate Node version requirement
const runtime = {
    expected: semver.validRange(pkg.engines.node), actual: semver.valid(process.version)
}
const valid = semver.satisfies(runtime.actual, runtime.expected);
if (!valid) {
    throw new Error(
        `Expected Node.js version ${runtime.expected}, but found v${runtime.actual}. Please update or change your runtime!`
    );
}
// configure  logger
logger.default.transports.console.colorize = true;
logger.default.transports.console.timestamp = true;
logger.default.transports.console.prettyPrint = config.env === 'development';
logger.level = config.logger.level;// start process
logger.warn(`Starting ${config.process.type} process`, { pid: process.pid });
if (config.process.type === 'web') { require('./web'); }
// dec12th17
else if (config.process.type === 'worker') { require('./worker'); }
else { throw new Error(`${config.process.type} is an unsupported process type.`); }