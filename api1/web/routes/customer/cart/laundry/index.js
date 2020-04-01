'use strict'

const post = require('./post')
const get = require('./get')
const patch = require('./patch')
const deletelaundry = require('./delete')
const update = require('./update')

 

module.exports = [].concat(
    post, 
    patch,
    get,
    deletelaundry,
    update
)