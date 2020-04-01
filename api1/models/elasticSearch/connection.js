'use strict'

const ElasticSearchUrl = require('../../config/components/elasticsearch');
const logger = require('winston');

var elasticsearch = require('elasticsearch');
var elasticClient;

var state = {
  connection: null,
}

exports.connect = (done) => {
  if (state.connection) return done()

  elasticClient = new elasticsearch.Client({
    // host: "http://elastic:rO3I6dppmYvlissRLwvr@45.76.180.89:9200/",
    host : process.env.ElasticSearchUrl,
    log: 'info'
  });
  state.connection = elasticClient
  done()

}

exports.get = () => {
  return state.connection
}