'use strict'
const logger = require('winston');
const elasticClient = require('../elasticSearch');
const tablename = 'products';
const indexName = process.env.ElasticProductIndex;
const version = 382;


function Select(data, callback) {
    elasticClient.get().search({
        index: indexName,
        type: tablename,
        body: {
            "query": {
                "match": data
            }
        }
    }, function (err, result) {
        callback(err, result);
    });
}
function SelectAll(callback) {
    elasticClient.get().search({
        index: indexName,
        type: tablename,
        body: {
            "query": {
                "match_all": {}
            }
        }
    }, function (err, result) {
        callback(err, result);
    });
}

function Insert(data, callback) {
    let _id = "" + data._id;
    delete data._id;
    elasticClient.get().index({
        index: indexName,
        type: tablename,
        id: _id,
        body: data
    }, (err, result) => {
        callback(err, result);
    });
}

function UpdateWithPush(_id, field, value, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            "script": "ctx._source." + field + ".add('" + value + "')"
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function UpdateWithPull(_id, field, value, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            "script": "ctx._source." + field + ".remove(ctx._source." + field + ".indexOf('" + value + "'))"
        }
    }, (err, results) => {
        callback(err, results);
    })
}

function Update(_id, data, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            doc: data,
            doc_as_upsert: true
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function updateByQuery(data, condition, callback) {
    elasticClient.get().updateByQuery({
        index: indexName,
        type: tablename,
        version: version,
        body: {
            query: {
                match:
                    { "term": { "userId": "59bb9b3ed5e9cb3fed133b72" } },
                "script": { "inline": "ctx._source.currentlyActive = false" }
            },
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function Delete(condition, callback) {
    elasticClient.get().deleteByQuery({
        index: indexName,
        type: tablename,
        version: version,
        body: {
            query: {
                match: condition
            }
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function DeleteAll(condition, callback) {
    elasticClient.get().deleteByQuery({
        index: indexName,
        type: tablename,
        version: version,
        body: {
            query: condition
        }
    }, (err, results) => {
        callback(err, results)
    })
}


module.exports = { Select, SelectAll, Insert, Update, updateByQuery, Delete, DeleteAll, UpdateWithPush, UpdateWithPull };