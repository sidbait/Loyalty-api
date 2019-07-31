const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getPlayerWalletBalance: async function (req, res) {

        let _player_id;
        let _app_id;
        let _np_balance;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);
        } catch (error) {
            _app_id = null;
            _player_id = null;
        }

        if (_player_id) {
            try {

                _np_balance = await services.commonServices.getWalletBalance(_player_id);

                customResult = { np_balance: _np_balance };

                services.sendResponse.sendWithCode(req, res, customResult, customMsgType, "GET_SUCCESS");

            }
            catch (error) {
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }
        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid Access Token or App Key', customMsgTypeCM, "VALIDATION_FAILED");

        }

    },

    getDetails: async function (req, res) {

        let _player_id;
        let _app_id;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

        } catch (error) {
            _app_id = null
            _player_id = null;
        }

        if (_player_id && _app_id) {

            let _query = {
                text: "SELECT * from fn_get_player_details($1,$2)",
                values: [_player_id, _app_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                console.log('playerDetails',dbResult);

                if (dbResult && dbResult.length > 0) {
                    services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
                }
            }
            catch (error) {
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid Access Token or App Key', customMsgTypeCM, "VALIDATION_FAILED");

        }
    }
}