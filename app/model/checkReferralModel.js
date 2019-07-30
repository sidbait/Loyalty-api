const pgConnection = require('./pgConnection');
const mongodb = require('./mongoConnectionPromise');
const uniqid = require('uniqid');

module.exports = {

    getPlayerData: async (playerId, appPlayerId, appId) => {
        return new Promise(async (resolve, reject) => {
            let _query;

            if (playerId) {
                _query = `select * from tbl_player_master where 1=1`

                if (playerId) {
                    _query += ` and player_id = ${playerId}`
                }
            } else {
                _query = `select player_id,status from tbl_player_app where app_player_id = '${appPlayerId}' and app_id = ${appId}`

                if (appPlayerId) {
                    _query += ` and player_id = ${appPlayerId}`
                }
                if (appId) {
                    _query += ` and player_id = ${appId}`
                }
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {
                    resolve(dbResult)
                } else {
                    // add failed log in mongo
                    mongodb.mongoinsert('ref_error_log', { error: 'player not found in getPlayerData()', player_id });
                    reject('player not found')
                }
            }
            catch (error) {
                console.log(error);
                mongodb.mongoinsert('ref_error_log', { error: 'code Error in getPlayerData()', player_id });
                reject(error)
            }
        });
    },

    genAndInsertRefCode: async (player_id) => {
        return new Promise(async function (resolve, reject) {
            try {
                let refcode = uniqid.time();
                let updateQuery = `update tbl_player_master set refcode = '${refcode}' where player_id = ${player_id} returning player_id,refcode`;

                let dbResult = await pgConnection.executeQuery('loyalty', updateQuery)

                if (dbResult && dbResult.length > 0) {
                    resolve(true)
                } else {
                    mongodb.mongoinsert('ref_error_log', { error: 'Update failed in genAndInsertRefCode()', player_id });
                    reject(false)
                }

            } catch (error) {
                console.log(error);
                mongodb.mongoinsert('ref_error_log', { error: 'code Error in genAndInsertRefCode()', player_id });
                reject(false)
            }

        });
    },

    getInviteCode: async (appId, playerId) => {
        return new Promise(async function (resolve, reject) {

            let inviteCode = uniqid();

            try {

                let _query = `select refcode from tbl_player_master where player_id = ${playerId}`;
                let dbResult = await pgConnection.executeQuery('loyalty', _query)
                let refcode = dbResult[0].refcode;

                let mData = await mongodb.mongoinsert('inviteCodes', { appId, playerId, inviteCode, refcode });

                let op = {
                    inviteCode,
                    refcode
                }

                console.log(mData);


                resolve(op)

            } catch (error) {
                console.log(error);

                mongodb.mongoinsert('ref_error_log', { error: 'code Error in getReferByPlayer()', inviteCode });
                reject(false)
            }
        });
    },

    getReferByPlayer: async (inviteCode, refcode, appId) => {
        return new Promise(async function (resolve, reject) {
            try {
                let mData;
                if (inviteCode) {
                    mData = await mongodb.mongofind('inviteCodes', { inviteCode, appId }, 0);
                    // console.log('is Duplicate inviteCodes?', inviteCode, appId, mData.length > 1);
                    if (mData.length > 1) {
                        mongodb.mongoinsert('ref_error_log', { error: 'Duplicate inviteCodes in getReferByPlayer()', inviteCode });
                    }
                } else {
                    mData = await mongodb.mongofind('inviteCodes', { refcode, appId }, 0);
                }

                resolve(mData[0]);

            } catch (error) {
                mongodb.mongoinsert('ref_error_log', { error: 'code Error in getReferByPlayer()', inviteCode });
                reject(false)
            }

        });
    },

    checkGoal: async (player_id, referBy, appId) => {

        return new Promise(async (resolve, reject) => {

            try {

                let _query = `select * from tbl_referrer_player_transaction where player_id = ${player_id} and app_id = ${appId}`;

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                if (dbResult && dbResult.length > 0) {
                    // check active goals from ref_trans table

                    resolve(dbResult);

                } else {
                    // insert active goals in ref_trans table
                    let _query = `select * from insert_ref_trans(${player_id},${appId},${referBy})`;

                    let dbResult = await pgConnection.executeQuery('loyalty', _query);


                    if (dbResult && dbResult.length > 0) {

                        let _query = `select * from tbl_referrer_player_transaction where player_id =${player_id} and app_id =${appId}`;

                        let dbResult = await pgConnection.executeQuery('loyalty', _query);


                        if (dbResult && dbResult.length > 0) {
                            // check active goals from ref_trans table

                            resolve(dbResult);

                        }
                    } else {
                        reject({ 'insert failed insert_ref_trans': dbResult })
                    }
                }
            }
            catch (error) {
                console.log(error);
                mongodb.mongoinsert('ref_error_log', { error: 'code Error in checkGoal()', player_id });
                reject(error)
            }
            // }
        });

    },

    getGoals: async (player_id, appId, goalCode) => {
        return new Promise(async (resolve, reject) => {
            try {

                let _query = `select * from tbl_referrer_player_transaction where player_id =${player_id} and app_id =${appId} and expiry_date > now()`;

                if (goalCode) {
                    _query += ` and goal_code = '${goalCode}'`;
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                resolve(dbResult);

            } catch (error) {

                reject(error)
            }
        });
    },

    getMobile: async (player_id) => {
        return new Promise(async (resolve, reject) => {

            let _query = `select mobile_number from tbl_player_master where player_id = ${player_id}`;

            try {

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                resolve(dbResult[0].mobile_number);

            } catch (error) {
                reject(error)
            }
        });
    },

    amountEarned: async (player_id) => {
        return new Promise(async (resolve, reject) => {

            let _query = `select coalesce(sum(reward_amount),0) as sum from tbl_referrer_player_transaction where referred_by = ${player_id} and is_goal_achieved = true`;

            try {

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                resolve(dbResult[0].sum);

            } catch (error) {
                reject(error)
            }
        });
    },

    getReferralDetail: async (player_id) => {
        return new Promise(async (resolve, reject) => {

            let _query = `select master.mobile_number,app.app_user_name,ref_transaction.goal_code,ref_transaction.is_goal_achieved,ref_transaction.reward_amount,ref_transaction.goal_achieved_from,ref_transaction.goal_achieved_to,ref_transaction.minimum_amount,ref_transaction.is_percentage,ref_transaction.status,ref_transaction.add_date::date,ref_transaction.goal_achieved_date::date,ref_transaction.expiry_date::date
            from tbl_referrer_player_transaction ref_transaction
            inner join tbl_player_app app on ref_transaction.player_id = app.player_id 
            inner join tbl_player_master master on master.player_id = app.player_id 
            where referred_by = ${player_id}`;

            try {

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                resolve(dbResult);

            } catch (error) {

                reject(error);
            }
        });
    },

    updateReferrerPlayerTransaction: async (player_id, goal_code, reward_amount) => {
        return new Promise(async (resolve, reject) => {

            let _query;

            if (reward_amount) {

                _query = `update tbl_referrer_player_transaction set is_goal_achieved = true, goal_achieved_date=now(),reward_amount = ${reward_amount} where player_id = ${player_id} and goal_code = '${goal_code}' and is_goal_achieved = false RETURNING player_id`;

            } else {

                _query = `update tbl_referrer_player_transaction set is_goal_achieved = true, goal_achieved_date=now() where player_id = ${player_id} and goal_code = '${goal_code}' and is_goal_achieved = false RETURNING player_id`;

            }

            try {

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                if (dbResult && dbResult.length > 0) {

                    resolve(true);

                } else resolve(false);

            } catch (error) {

                console.log(error);

                reject(false);
            }
        });
    },


}