const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');
const logger = require('tracer').colorConsole();
const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    walletTransaction: async function (req, res) {

        let rules = {
            "order_id": 'required',
            "txn_type": 'required|in:DEBIT,CREDIT,REFUND',
            "txn_mode": 'required|in:REWARD,EVENT',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _app_id = req.appId;
            let _player_id = req.userDetails.playerId
            let _event_id = req.body.event_id ? req.body.event_id : null;
            let _event_code = req.body.event_code ? req.body.event_code : null;
            let _event_name = req.body.event_name ? req.body.event_name : null;
            let _np_balance;
            let _order_id = req.body.order_id ? req.body.order_id : null;
            let _txn_type = req.body.txn_type ? req.body.txn_type.toUpperCase() : null;
            let _txn_mode = req.body.txn_mode ? req.body.txn_mode.toUpperCase() : null;
            let _reward_id = req.body.reward_id ? req.body.reward_id.toUpperCase() : null;
            let _txn_status = req.body.txn_status ? req.body.txn_status.toUpperCase() : 'PENDING';

            try {
                _np_balance = await services.commonServices.getWalletBalance(_player_id);
            } catch (error) {
                logger.error('getWalletBalance Catch Err : ', error)
            }

            logger.info("\n-------------------------------------------------------\n" +
                'Log type: Wallet Transaction \n' +
                'App Id : ' + _app_id + '\n' +
                'Player Id : ' + _player_id + '\n' +
                'NP Balance : ' + _np_balance + '\n' +
                '-------------------------------------------------------\n');

            let _query = {
                text: "SELECT * from fn_wallet_transaction($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
                values: [_app_id, _player_id, _event_id, _event_code, _event_name, _np_balance, _order_id, _txn_type, _txn_status, _txn_mode, _reward_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "TXN_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "TXNl_FAILED");
                }
            }
            catch (error) {
                logger.error('walletTransaction Catch Err : ', error)
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");
        }
    },


    walletHistory: async function (req, res) {

        let _app_id = req.appId;
        let _player_id = req.userDetails.playerId

        let _query = {
            text: "SELECT * from fn_wallet_history($1)",
            values: [_player_id]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query)

            if (dbResult && dbResult.length > 0 && dbResult[0].data) {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "NO_DATA_FOUND");
            }

        }
        catch (error) {
            logger.error('walletHistory Catch Err : ', error)
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }

    }
}