const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');
var logger = require('tracer').colorConsole();
const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getPlayerWalletBalance: async function (req, res) {

        let _app_id = req.appId;
        let _player_id = req.userDetails.playerId
        let _np_balance;

        try {
            _np_balance = await services.commonServices.getWalletBalance(_player_id);
            customResult = { np_balance: _np_balance };
            services.sendResponse.sendWithCode(req, res, customResult, customMsgType, "GET_SUCCESS");
        }
        catch (error) {
            logger.error('getPlayerWalletBalance Error : ', error)
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }

    },

    getDetails: async function (req, res) {

        let _app_id = req.appId;
        let _player_id = req.userDetails.playerId

        let _query = {
            text: "SELECT * from fn_get_player_details($1,$2)",
            values: [_player_id, _app_id]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query, true, 60 * 10)

            if (dbResult && dbResult.length > 0) {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            logger.error('Player getDetails Error : ', error)
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }
    },

    wonRewards: async function (req, res) {

        let _app_id = req.appId;
        let _player_id = req.userDetails.playerId

        let _query = {
            text: "SELECT * from fn_get_player_won_rewards($1)",
            values: [_player_id]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query, true, 60 * 10)

            if (dbResult && dbResult.length > 0 && dbResult[0].data && dbResult[0].data.length > 0) {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            logger.error('wonRewards Error : ', error)
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }

    }
}