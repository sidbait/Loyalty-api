
const pgConnection = require('../model/pgConnection');
const config = require('config');
var uniqid = require('uniqid');
var rp = require('request-promise');

module.exports = {

    getAppId: async (appKey) => {

        return new Promise(async function (resolve, reject) {
            try {

                if (appKey) {
                    let _query = {
                        text: `SELECT app_id FROM tbl_app_master WHERE app_key = $1`,
                        values: [appKey]
                    }

                    let dbResult = await pgConnection.executeQuery('loyalty', _query);

                    console.log('getAppId', dbResult);


                    if (dbResult && dbResult.length > 0) {
                        resolve(dbResult[0].app_id);
                    }
                    else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },

    getPlayerIdByToken: async (token, appId) => {

        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT player_id FROM tbl_player_app WHERE nz_access_token = $1 and app_id = $2`,
                    values: [token, appId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getPlayerIdByToken', dbResult);

                if (dbResult && dbResult.length > 0) {
                    resolve(parseInt(dbResult[0].player_id));
                }
                else {
                    resolve(null);
                }

            } catch (error) {
                console.log('getPlayerIdByToken');
                console.log(error);

                reject(error)
            }

        });

    },

    getPlayerIdByMobile: async (mobile) => {

        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT player_id FROM tbl_player_master WHERE mobile_number = $1`,
                    values: [mobile]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getPlayerIdByToken', dbResult);

                if (dbResult && dbResult.length > 0) {
                    resolve(parseInt(dbResult[0].player_id));
                }
                else {
                    resolve(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },

    getWalletBalance: async (playerId) => {

        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT np_balance FROM tbl_player_wallet WHERE player_id = $1`,
                    values: [playerId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getWalletBalance', dbResult);

                if (dbResult && dbResult.length > 0) {
                    resolve(dbResult[0].np_balance);
                }
                else {
                    reject(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },



    walletTransaction: (txn_amt, app_id, player_id, reward_id = null, txn_type, txn_status, txn_mode, goods_id = null, event_id = null, event_code = null, event_name = null, ) => {
        return new Promise(async function (resolve, reject) {

            let np_balance;
            try {
                np_balance = await module.exports.getWalletBalance(player_id)
            } catch (error) {
                console.log(error);
                np_balance = 0
            }

            console.log('np_balance', np_balance, txn_type);
            if (txn_type == 'DEBIT' && np_balance < txn_amt) {
                resolve(false);
            } else {

                let _query = {
                    text: "SELECT * from fn_update_wallet($1,$2,$3)",
                    values: [player_id, txn_amt, txn_type]
                }

                try {

                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult[0].fn_update_wallet) {

                        let _order_id = uniqid('ORD-');
                        if (txn_type == 'CREDIT')
                            _order_id = 'CR-' + _order_id
                        else if (txn_type == 'DEBIT')
                            _order_id = 'DB-' + _order_id
                        else if (txn_type == 'REFUND')
                            _order_id = 'RE-' + _order_id

                        console.log('player_id', typeof player_id, player_id);

                        console.log('player_id', typeof reward_id, reward_id);

                        let _query = {
                            text: "SELECT * from fn_wallet_transaction($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                            values: [app_id, player_id, event_id, event_code, event_name, txn_amt, _order_id, txn_type, txn_status, txn_mode, reward_id, goods_id]
                        }

                        let dbResult = await pgConnection.executeQuery('loyalty', _query)

                        if (dbResult && dbResult.length > 0) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }

                } catch (error) {
                    reject(error)
                }


            }
        });
    },

    getRewardBuyAmt: (rewardId) => {
        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT buy_amount FROM tbl_reward WHERE reward_id = $1 and status = 'ACTIVE'`,
                    values: [rewardId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getRewardBuyAmt', dbResult);

                if (dbResult && dbResult.length > 0) {

                    resolve(parseInt(dbResult[0].buy_amount));
                }
                else {
                    resolve(0);
                }

            } catch (error) {
                reject(error)
            }

        });
    },

    getGoodsBuyAmt: (goodsId) => {
        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT buy_amount FROM tbl_goods_master WHERE goods_id = $1 and status = 'ACTIVE'`,
                    values: [goodsId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getGoodsBuyAmt', dbResult);

                if (dbResult && dbResult.length > 0) {

                    resolve(parseInt(dbResult[0].buy_amount));
                }
                else {
                    resolve(0);
                }

            } catch (error) {
                reject(error)
            }

        });
    },

    getLeftSaleGoods: (goodsId) => {
        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `select * from fn_goods_left_sale($1)`,
                    values: [goodsId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getLeftSaleGoods', dbResult);

                if (dbResult && dbResult.length > 0) {

                    resolve(dbResult[0].p_out_is_sale);
                }
                else {
                    resolve(false);
                }

            } catch (error) {
                reject(error)
            }

        });
    },

    getMaxSalePerUser: (goodsId, playerId) => {
        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `select * from fn_goods_max_sale_user($1,$2)`,
                    values: [goodsId, playerId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getLeftSaleGoods', dbResult);

                if (dbResult && dbResult.length > 0) {

                    resolve(dbResult[0].p_out_is_sale);
                }
                else {
                    resolve(false);
                }

            } catch (error) {
                reject(error)
            }

        });
    },

    getTimeDiif: (dt1, dt2) => {
        var diff = (dt1.getTime() - dt2.getTime()) / 1000;
        // diff /= 60;
        return Math.round(diff);
    },

    randomString(length) {

        var text = "";

        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++) {

            text += possible.charAt(Math.floor(Math.random() * possible.length));

        }

        return text;
    },

    otpNumber() {

        var text = "";
        var possible = "0123456789";

        for (var i = 0; i < 4; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length)).toString();
        }

        return text;
    },


    declareWinner: (rewardId) => {
        return new Promise(async function (resolve, reject) {
            try {


                let winCountQuery = {
                    text: `SELECT count(*) FROM tbl_reward_winners where reward_id = $1`,
                    values: [rewardId]
                }

                let winCount = await pgConnection.executeQuery('loyalty', winCountQuery);
                winCount = parseInt(winCount[0].count)

                console.log('winCount', winCount, winCount == 0);

                if (winCount == 0) {

                    let _query = {
                        text: `SELECT * FROM fn_get_reward_winner($1)`,
                        values: [rewardId]
                    }

                    let dbResult = await pgConnection.executeQuery('loyalty', _query);

                    console.log('Reward Winner dbResult');
                    console.log(dbResult);


                    if (dbResult && dbResult.length > 0 && dbResult[0].data) {
                        resolve(dbResult[0].data);
                    }
                    else {
                        resolve(null);
                    }

                } else {
                    resolve(null);
                }

            } catch (error) {
                reject(error)
            }

        });
    },


    genrateRewards: (rewardId) => {
        return new Promise(async (resolve, reject) => {

            try {
                let _genQuery = {
                    text: "select * from fn_generate_rewards($1)",
                    values: [rewardId]
                }

                let genResult = await pgConnection.executeQuery('loyalty', _genQuery)

                if (genResult && genResult.length > 0 && genResult[0].p_out_reward_id) {

                    resolve(true)
                    /*   let _updateQuery = {
                          text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                          values: [rewardsData[i].reward_id]
                      }
  
                      let deactiveRewards = await pgConnection.executeQuery('loyalty', _updateQuery) */
                } else {
                    resolve(false)
                }

            } catch (error) {
                reject(error)
            }

        })
    },


    participantsCount: (rewardId) => {
        return new Promise(async (resolve, reject) => {

            try {
                let _participantQuery = {
                    text: "select count(*) from tbl_reward_participants where reward_id = $1",
                    values: [rewardId]
                }
                let _participantsCount = await pgConnection.executeQuery('loyalty', _participantQuery)

                if (_participantsCount && _participantsCount.length > 0) {
                    resolve(_participantsCount[0].count)
                } else {
                    resolve(0)
                }

            } catch (error) {
                reject(error)
            }

        })
    },

    registerEventClaim: (playerId, appId) => {
        return new Promise(async (resolve, reject) => {

            try {
                let event_id, event_name, event_code, points;
                let eventQuery = `select * from tbl_app_events where event_code = 'REG' and status= 'ACTIVE'`
                let eventResponse = await pgConnection.executeQuery('loyalty', eventQuery)

                console.log('_participantsCount')
                console.log(eventResponse);
                if (eventResponse && eventResponse.length > 0) {

                    event_id = eventResponse[0].event_id
                    event_name = eventResponse[0].event_name
                    event_code = eventResponse[0].event_code
                    points = eventResponse[0].points

                    let isClaimQuery = `select count(*) from tbl_wallet_transaction where player_id = ${playerId} and event_code = 'REG'`
                    let isClaim = await pgConnection.executeQuery('loyalty', isClaimQuery)
                    console.log('isClaimQuery')
                    console.log(isClaim);
                    if (isClaim[0].count == 0) {
                        creditSuccess = await module.exports.walletTransaction(points, appId, playerId, null, 'CREDIT', 'SUCCESS', 'EVENT', null, event_id, event_code, event_name)

                        console.log(creditSuccess);

                        if (creditSuccess) {
                            resolve(true)
                        } else {
                            resolve(false)
                        }
                    } else {
                        resolve(false)
                    }
                } else {
                    resolve(false)
                }
            } catch (error) {
                console.log(error);
                reject(error)
            }
        })

    },

    reedeemCash: (rwid, access_token, api_key,type) => {
        console.log('reedeemCash Start');
        let options = {
            method: 'POST',
            url: config.withdrawAPI.endPoint + 'withdrawloyality',
            headers:
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'access-token': access_token,
                'x-naz-app-key' : api_key
            },
            form:{
                rwid :(type == 'rewards') ? rwid : null,
                goods_id: (type == 'goods') ? rwid : null
            },
            json: true
        };

        console.log('reedeemCash options', options);


        return new Promise(async function (resolve, reject) {
            rp(options)
                .then(function (data) {
                    // POST succeeded...
                    console.log('POST succeeded...', data);
                    resolve(data)

                })
                .catch(function (err) {
                    // POST failed...
                    console.log('POST failed...');
                    reject(err)
                });
        });
    },

    sendSMS: (msg, mobile) => {

        var options = {
            method: 'GET',
            url: `http://203.115.112.8/CommonMTURLAllOperator/Bigpesa.aspx?id=nazara&pwd=nazara063&msisdn=${mobile}&msg=${msg}`,//'http://203.115.112.8/CommonMTURLAllOperator/NextWVMtmd.aspx',
            /*  qs:
             {
                 id: 'ntwvmd',
                 pwd: 'ntwvmd2105',
                 msisdn: '918600366639',
                 msg: msg
             }, */
            /*   headers:
              {
                  'Content-Type': 'application/x-www-form-urlencoded'
              } */
        };

        console.log('sendSMS', options);


        return new Promise(async function (resolve, reject) {
            rp(options)
                .then(function (data) {
                    // POST succeeded...
                    console.log('POST succeeded...', data);
                    resolve(data)

                })
                .catch(function (err) {
                    // POST failed...
                    console.log('POST failed...');
                    reject(err)
                });
        });
    },

    testFun: (rewardId) => {

        return new Promise(async function (resolve, reject) {
            try {

                /*    let _winQuery = {
                       text: "select * from fn_get_player_details($1)",
                       values: [12]
                   }
   
                   let q = 'select nz_access_token  from tbl_player_app where player_id = 12 limit 1' */
                /* 
                                let _winQuery = {
                                    text: "select * from fn_get_winner_detais($1)",
                                    values: [rewardId]
                                }
                
                                let winResult = await pgConnection.executeQuery('loyalty', _winQuery)
                 */
                let _query = {
                    text: `SELECT * FROM fn_validate_appkey($1)`,
                    values: [rewardId]
                }


                let deactiveRewards = await pgConnection.executeQuery('loyalty', _query)


                // let winResult = await pgConnection.executeQuery('loyalty', q)

                console.log(deactiveRewards);

                resolve(deactiveRewards)

                /*   console.log(winResult[0].p_out_reward_id); */


            } catch (err) {
                console.error(err);
                reject(err)
            }

        });
    }

}