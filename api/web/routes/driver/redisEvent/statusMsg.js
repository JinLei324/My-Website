module.exports.status = function (successCode, data, language) {
    var return_;
    switch (successCode) {
        case 11:
            return_ = 'Sorry , we cannot take up your delivery request at this moment , all our drivers are busy. Please try again after sometime.';
            break;
        default:
            return_ = 'no data';
    }
    return return_;
}