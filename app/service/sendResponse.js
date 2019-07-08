const customMessage = require('../service/customMessage.js')

module.exports = {

    sendDBResponse: function (err, result, req, res, message, statusCode) {

        var response = {};
        response.statusCode = statusCode;

        if (err) {

            response.success = false;
            response.message = 'Error occured to data base - ' + err.toString();
            response.data = null;

            res.json(response)
        }
        else {
            if (result.length > 0) {

                response.success = true;
                response.message = message;
                response.data = result

                res.json(response)
            }
            else {

                response.success = false;
                response.message = "Details not found!";
                response.data = null;
                res.json(response)
            }
        }
    },
    
    sendWithCode: function (req, res, customJSON, customMsgType, customMsgCode) {

        var response = {}; 

        if (customMessage[customMsgType] && customMessage[customMsgType][customMsgCode]) {
            response.success = customMessage[customMsgType][customMsgCode].success;
            response.statusCode = customMessage[customMsgType][customMsgCode].statusCode
            response.messageCode = customMessage[customMsgType][customMsgCode].messageCode
            response.message = customMessage[customMsgType][customMsgCode].message;
            response.data = customJSON;
        }
        else {
            response.success = false;
            response.statusCode = "";
            response.messageCode = "";
            response.message = "Empty Message!";
            response.data = customJSON;
        }

        res.json(response)
    }
}