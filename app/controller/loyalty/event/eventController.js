const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getEvents: async function (req, res) {
        let _app_id;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);

        } catch (error) {
            _app_id = null;
        }

        if (_app_id) {

            let _query = {
                text: "SELECT * FROM fn_get_events($1)",
                values: [_app_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {

                    services.sendResponse.sendWithCode(req, res, dbResult[0], customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
                }
            }
            catch (error) {
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }
        } else {
            services.sendResponse.sendWithCode(req, res, "Invalid App Key", customMsgTypeCM, "VALIDATION_FAILED");
        }


    },
}