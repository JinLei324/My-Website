
'use strict';

module.exports.status = function (successCode, data, language) {
    var return_;
    switch (successCode) {
        case 2:
            return_ = { errNum: 200, errMsg: 'success', errFlag: 0, data: data };
            break;
        case 3:
            return_ = { errNum: 500, errMsg: "Internal error.", errFlag: 1, data: data };
            break;
        default:
            return_ = { errNum: 404, errMsg: 'no data', errFlag: 1, 'data': data };
    }
    return return_;
}

