const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {


    getAll: async function (req, res) {

        let _goods_id = req.body.goods_id ? parseInt(req.body.goods_id) : null;

        let _query = {
            text: "SELECT * from fn_get_goods($1)",
            values: [_goods_id]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query)

            console.log('goods Details', dbResult);


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

    buyGoods: async (req, res) => {
        let rules = {
            "goods_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id;
            let _player_id;
            let _goods_id = req.body.goods_id ? parseInt(req.body.goods_id) : null;

            let walletBal;
            let goodsBuyAmt;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                let _is_sale = await services.commonServices.getLeftSaleGoods(_goods_id)
                let _is_sale_per_user = await services.commonServices.getMaxSalePerUser(_goods_id, _player_id)
                if (_is_sale && _is_sale_per_user) {

                    try {
                        walletBal = await services.commonServices.getWalletBalance(_player_id)
                        goodsBuyAmt = await services.commonServices.getGoodsBuyAmt(_goods_id)
                    } catch (error) {
                        walletBal = 0
                        goodsBuyAmt = null
                    }

                    if (goodsBuyAmt > 0) {

                        if (walletBal >= goodsBuyAmt) {

                            let _walletBal = await services.commonServices.getWalletBalance(_player_id)
                            let debitSuccess;

                            console.log('player_id', typeof _player_id, _player_id);
                            console.log('player_id', typeof _goods_id, _goods_id);

                            try {
                                debitSuccess = await services.commonServices.walletTransaction(goodsBuyAmt, _app_id, _player_id, null, 'DEBIT', 'SUCCESS', 'GOODS', _goods_id)
                            } catch (error) {
                                console.log(error);
                                debitSuccess = false
                            }

                            console.log('debitSuccess', debitSuccess);

                            if (debitSuccess) {


                                let reedeemSuccess = await services.commonServices.reedeemCash(_rw_id, req.headers["access-token"], req.headers["x-naz-app-key"],'goods')

                                if (reedeemSuccess.Success) {

                                    let _query = {
                                        text: "SELECT * from fn_buy_goods($1,$2,$3,$4)",
                                        values: [_player_id, _goods_id, 'ACTIVE',_app_id]
                                    }

                                    let dbResult = await pgConnection.executeQuery('loyalty', _query)
                                    console.log('fn_buy_goods', dbResult);
                                    // dbResultArr.push(dbResult[0])

                                    if (dbResult && dbResult.length > 0) {
                                        services.sendResponse.sendWithCode(req, res, dbResult[0], customMsgType, "GET_SUCCESS");
                                    } else {
                                        services.sendResponse.sendWithCode(req, res, '', 'COMMON_MESSAGE', "ERROR");
                                    }

                                } else {
                                    let refundSuccess;
                                    try {
                                        refundSuccess = await services.commonServices.walletTransaction(goodsBuyAmt, _app_id, _player_id, null, 'REFUND', 'SUCCESS', 'GOODS', _goods_id)
                                    } catch (error) {
                                        console.log(error);
                                        refundSuccess = false
                                    }

                                    services.sendResponse.sendWithCode(req, res, '', 'COMMON_MESSAGE', "ERROR");
                                }

                            } else {
                                services.sendResponse.sendWithCode(req, res, '', 'COMMON_MESSAGE', "ERROR");
                            }

                        } else {
                            let customResponse = { np_balance: walletBal }
                            services.sendResponse.sendWithCode(req, res, customResponse, customMsgTypeCM, "INSUFFICIENT_BALANCE");
                        }
                    } else {
                        services.sendResponse.sendWithCode(req, res, null, customMsgTypeCM, "CONTEST_ENDED");
                    }

                } else {
                    services.sendResponse.sendWithCode(req, res, 'Max Sale Limit per Day Exceeded', customMsgType, "GET_FAILED");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid Access Token', customMsgTypeCM, "INVALID_ACCESS_TOKEN");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

}