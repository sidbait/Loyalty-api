
const pgConnection = require('../model/pgConnection');
var uniqid = require('uniqid');

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



    walletTransaction: (txn_amt, app_id, player_id, reward_id = null, txn_type, txn_status, txn_mode, event_id = null, event_code = null, event_name = null, ) => {
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
                            text: "SELECT * from fn_wallet_transaction($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
                            values: [app_id, player_id, event_id, event_code, event_name, txn_amt, _order_id, txn_type, txn_status, txn_mode, reward_id]
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


    declareWinner: (rewardId) => {
        return new Promise(async function (resolve, reject) {
            try {


                let winCountQuery = {
                    text: `SELECT count(*) FROM tbl_reward_winners where reward_id = $1`,
                    values: [rewardId]
                }

                let winCount = await pgConnection.executeQuery('loyalty', winCountQuery);
                winCount = parseInt(winCount[0].count)

                console.log('winCount' , winCount , winCount == 0);
                
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
                let _updateQuery = {
                    text: "update tbl_reward set statuss='DEACTIVE' where reward_id= $1",
                    values: [rewardId]
                }
                let deactiveRewards = await pgConnection.executeQuery('loyalty', _updateQuery)


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