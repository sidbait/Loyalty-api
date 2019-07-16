const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');

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

            let _app_id;
            let _player_id;
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
                _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);
                _np_balance = await services.commonServices.getWalletBalance(_player_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            console.log('_app_id', _app_id);
            console.log('_player_id', _player_id);
            console.log('_np_balance', _np_balance);

            if (_app_id && _player_id) {
                //  let _selectQuery = 'SELECT * from fn_get_app($1,$2)'
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
                    services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }
    }
}