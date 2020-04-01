
var zendesk = require('node-zendesk');
var request = require('request');
var config = require('./config')
var request = require('request');

var headerOption = {
    "url": config.zd_url + "/auth/",
    "headers": {
        "Authorization": "Basic " + new Buffer(config.zd_email + ':' + config.zd_pass).toString("base64")
    }
};

//get operation perform here
get = function (url, callback) {
    getRequestBody(url, function (err, response) {
        if (!err) {
            callback(null, response);
        }
    })
}

//post operation perform here
var post = function (data, url, callback) {
    postRequestBody(data, url, function (err, response) {
        if (!err) {
            callback(null, response);
        }
    })
}

//put operation perform here
var put = function (data, url, callback) {
    putRequestBody(data, url, function (err, response) {
        if (!err) {
            callback(null, response);
        }
    })
}

//delete multiple ticket
var deleteZen = function (url, callback) {
    deleteRequestBody(url, function (err, response) {
        if (!err) {
            callback(null, response);
        }
    })
}

//Post request body prepared
var postRequestBody = function (data, url, callback) {
    var options = {
        method: 'POST',
        url: url,
        headers:
        {
            authorization: headerOption.headers.Authorization,
            'content-type': 'application/json'
        },
        body: data,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        return callback(null, body);
    })
}

//Put request body prepared
var putRequestBody = function (data, url, callback) {
    var options = {
        method: 'PUT',
        url: url,
        headers:
        {
            authorization: headerOption.headers.Authorization,
            'content-type': 'application/json'
        },
        body: data,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        return callback(null, body);
    })
}

//delete request body prepared
var deleteRequestBody = function (url, callback) {
    var options = {
        method: 'DELETE',
        url: url,
        headers:
        {
            authorization: headerOption.headers.Authorization,
            'content-type': 'application/json'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        return callback(null, body);
    })
}


//Get request body prepared
var getRequestBody = function (url, callback) {
    var options = {
        method: 'GET',
        url: url,
        headers:
        {
            authorization: headerOption.headers.Authorization,
            'content-type': 'application/json'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        return callback(null, body);
    })
}

module.exports = {
    deleteZen,
    get,
    post,
    put

}
