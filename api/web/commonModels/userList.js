var userListCollection = require("../../models/userList");
var ObjectId = require("mongodb").ObjectID;

class userList {

    /**
     * 
     * @param {*} _idInString 
     * @param {*} firstName 
     * @param {*} lastName 
     * @param {*} pushToken 
     * @param {*} profilePic 
     * @param {*} countrycode 
     * @param {*} userType 
     * @param {*} firebaseTopic 
     */
    createUser(_idInString, firstName, lastName, pushToken, profilePic, countrycode, userType, firebaseTopic, mqttTopic, deviceType) {
        let dataToInsert = {
            _id: ObjectId(_idInString),
            firstName: firstName,
            lastName: lastName,
            pushToken: pushToken,
            profilePic: profilePic,
            phone: countrycode,
            userType: userType,
            firebaseTopic: firebaseTopic,
            mqttTopic: mqttTopic,
            deviceType : deviceType
       };

        userListCollection.updateD(dataToInsert, () => { });
    }

    /**
     * 
     * @param {*} _idInString 
     * @param {*} dataAsObject 
     * field may be firstName, lastName, pushToken, profilePic, countrycode, userType, firebaseTopic
     */
    updateUser(_idInString, dataAsObject) {
        userListCollection.UpdateById(_idInString, dataAsObject, () => { })
    }


    /**
     * 
     * @param {*} _idInString 
     */
    deleteUser(_idInString) {
        userListCollection.Delete({ _id: ObjectId(_idInString) }, () => { })
    }

    getPushToken(_idInString, callback) {
        userListCollection.SelectOne({ _id: ObjectId(_idInString) }, (err, result) => {
            let pushToken = "No have Push || user in DB";
            if (result && result.pushToken != null) {
                pushToken = result.pushToken;
            }
            return callback({ pushToken: pushToken });
        })
    }

}


module.exports = new userList();