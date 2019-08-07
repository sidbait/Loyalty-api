const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getEvents: async function (req, res) {

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);

        } catch (error) {
            _app_id = null;
        }

        let _query = {
            text: "SELECT * FROM fn_get_events($1)",
            values: [_app_id]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query)

            if (dbResult && dbResult.length > 0) {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }

    },

    claimEvent: async (req, res) => {

        let rules = {
            "event_code": 'required',
        };

        let validation = new services.validator(req.body, rules);
        console.log("Event Body");
        console.log(req.body);


        if (validation.passes()) {

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                let _event_code = req.body.event_code ? req.body.event_code : null;
                let _event_id, _event_name, creditPoints, creditSuccess;

                try {

                    let _query = {
                        text: "SELECT event_id,event_code,points,event_name FROM tbl_app_events where event_code = $1 and app_id = $2 and status = 'ACTIVE'",
                        values: [_event_code, _app_id]
                    }
                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult.length > 0) {

                        creditPoints = dbResult[0].points
                        _event_id = dbResult[0].event_id
                        _event_name = dbResult[0].event_name
                        console.log(dbResult[0]);

                        creditSuccess = await services.commonServices.walletTransaction(creditPoints, _app_id, _player_id, null, 'CREDIT', 'SUCCESS', 'EVENT', null, _event_id, _event_code, _event_name)
                        if (creditSuccess) {
                            services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "TXN_SUCCESS");
                        } else {
                            services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "TXN_FAILED");
                        }

                    } else {
                        services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
                    }

                } catch (error) {

                    console.log(error);

                    services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid Access Token', customMsgTypeCM, "INVALID_ACCESS_TOKEN");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }

    }
}