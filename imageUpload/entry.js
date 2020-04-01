var express = require('express');
var app = express();
var async = require('async');
var moment = require('moment');
var morgan = require('morgan');
var config = require('./config.json');
var bodyParser = require('body-parser'),
    port = process.env.PORT || config.port;
var fs = require('fs');
var path = require('path');
var cors = require('cors');
const fileUpload = require('express-fileupload');
app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
//cross origin
app.use(cors());

// Set View Engine
app.engine('html', require('hogan-express'));

// By default, Express will use a generic HTML wrapper (a layout) to render all your pages. If you don't need that, turn it off.
app.set('view options', {
    layout: true
});

// Set the layout page. Layout page needs {{{ yield }}}  where page content will be injected
app.set('layout', 'container');

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.PORT || config.port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    res.send('Hello World for image upload!');
});

app.use('/', require(__dirname + '/routes/routes'));
 

app.listen(port, function () {
    console.log('Listening on port ' + port);
});
