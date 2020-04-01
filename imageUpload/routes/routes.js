var express = require('express'),
    path = require("path"),
    router = express.Router(),
    imageupload = require('../controllers/imageupload');


/**
 * image upload form
 */
router.get('/uploadform', function (req, res) {
    res.render('uploadimage', {
        title: '',
    });
});

/**
 * upload image to s3 bucket in aws
 */
router.post('/s3', imageupload.s3upload11);



module.exports = router;
