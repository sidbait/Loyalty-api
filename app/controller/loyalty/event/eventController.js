const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getEvents: async function (req, res) {

        let _app_id = req.userDetails.appId;

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

 
        if (validation.passes()) {

            let _app_id = req.userDetails.appId;
            let _player_id = req.userDetails.playerId;
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
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }

    }
}