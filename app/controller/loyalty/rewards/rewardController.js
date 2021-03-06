const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');
const logger = require('tracer').colorConsole();
const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getAll: async (req, res) => {

        let _app_id = req.appId;
        let _player_id = req.userDetails.playerId
        let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;
        let _status = req.body.status ? req.body.status.toUpperCase() : null;

        let customResult;

        let _query = {
            text: "SELECT * from fn_get_rewards($1,$2,$3)",
            values: [_player_id, _reward_id, _status]
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query)

            if (dbResult && dbResult.length > 0) {

                if (dbResult[0].data && dbResult[0].data.length > 0) {

                    let rewardsData;
                    let joinData;

                    rewardsData = dbResult[0].data
                    joinData = dbResult[1].data

                    let rewardsDataLength = rewardsData.length

                    for (let i = 0; i < rewardsDataLength; i++) {


                        rewardsData[i].show_reward = true
                        let startTime = new Date(rewardsData[i].from_date)
                        let repeatMin = rewardsData[i].repeat_min

                        let endTime = new Date(startTime.getTime() + repeatMin * 60000);
                        let currentDate = new Date();
                        currentDate.setHours(currentDate.getHours() + 5);
                        currentDate.setMinutes(currentDate.getMinutes() + 30);
                        let remainingSeconds = services.commonServices.getTimeDiif(endTime, currentDate)

                        rewardsData[i].remaining_seconds = remainingSeconds
                        rewardsData[i].winner = null

                        if (joinData) {
                            for (let joinCount = 0; joinCount < joinData.length; joinCount++) {
                                if (rewardsData[i].reward_id == joinData[joinCount].reward_id) {
                                    rewardsData[i].joins = joinData[joinCount].join
                                    break;
                                } else {
                                    rewardsData[i].joins = 0
                                }
                            }
                        } else {
                            rewardsData[i].joins = 0
                        }
                    }

                    logger.info('Rewards Data : ', rewardsData)

                    customResult = rewardsData
                    services.sendResponse.sendWithCode(req, res, customResult, customMsgType, "GET_SUCCESS");

                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "NO_DATA_FOUND");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            logger.error('Rewards getAll Catch Err : ', error)
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }
    },

    rewardParticipate: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id = req.appId;
            let _player_id = req.userDetails.playerId
            let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;
            let _ticket_code = req.body.ticket_code ? req.body.ticket_code : null;
            let _txn_status = req.body.txn_status ? req.body.txn_status.toUpperCase() : 'ACTIVE';
            let _count = req.body.count ? req.body.count : 1;

            let walletBal;
            let rewardBuyAmt;

            try {
                walletBal = await services.commonServices.getWalletBalance(_player_id)
                rewardBuyAmt = await services.commonServices.getRewardBuyAmt(_reward_id)
            } catch (error) {
                walletBal = 0
                rewardBuyAmt = null
            }

            if (rewardBuyAmt && rewardBuyAmt > 0) {

                if (walletBal >= (rewardBuyAmt * _count)) {

                    let dbResultArr = [];
                    for (let count = 0; count < _count; count++) {

                        let _walletBal = await services.commonServices.getWalletBalance(_player_id)
                        let debitSuccess;

                        try {
                            debitSuccess = await services.commonServices.walletTransaction(rewardBuyAmt, _app_id, _player_id, _reward_id, 'DEBIT', 'SUCCESS', 'REWARD')
                        } catch (error) {
                            logger.error('rewardParticipate walletTransaction Catch Err : ', error)
                            debitSuccess = false
                        }

                        if (debitSuccess) {
                            _ticket_code = services.commonServices.randomString(10)

                            let _query = {
                                text: "SELECT * from fn_reward_participate($1,$2,$3,$4,$5)",
                                values: [_player_id, _reward_id, _ticket_code, _txn_status, _app_id]
                            }

                            let dbResult = await pgConnection.executeQuery('loyalty', _query)
                            dbResultArr.push(dbResult[0])

                        }
                    }

                    logger.info("\n-------------------------------------------------------\n" +
                        'Log type: Reward Participate Array \n' +
                        'dbResultArr :  ' + dbResultArr + '\n' +
                        '-------------------------------------------------------\n');

                    if (dbResultArr && dbResultArr.length > 0) {
                        services.sendResponse.sendWithCode(req, res, dbResultArr, customMsgType, "GET_SUCCESS");

                    } else {
                        services.sendResponse.sendWithCode(req, res, dbResultArr, customMsgType, "GET_FAILED");
                    }

                } else {
                    let customResponse = { np_balance: walletBal }
                    services.sendResponse.sendWithCode(req, res, customResponse, customMsgTypeCM, "INSUFFICIENT_BALANCE");
                }
            } else {
                services.sendResponse.sendWithCode(req, res, null, customMsgTypeCM, "CONTEST_ENDED");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    claimRewards: async (req, res) => {

        let rules = {
            "rw_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id = req.appId;
            let _player_id = req.userDetails.playerId
            let _rw_id = req.body.rw_id ? parseInt(req.body.rw_id) : null;
            let _reward_id;
            let _rm_id;
            let _win_amount;
            let _reward_type;

            try {

                let _query = {
                    text: "SELECT * from fn_get_reward_win_amt($1,$2)",
                    values: [_player_id, _rw_id]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0 && dbResult[0].data && dbResult[0].data.length > 0 && dbResult[0].data[0].reward_id) {

                    _reward_id = dbResult[0].data[0].reward_id ? parseInt(dbResult[0].data[0].reward_id) : null
                    _win_amount = dbResult[0].data[0].win_amount ? parseInt(dbResult[0].data[0].win_amount) : null
                    _reward_type = dbResult[0].data[0].reward_type

                    if (_reward_type.toUpperCase() == 'COIN') {
                        let creditSuccess = await services.commonServices.walletTransaction(_win_amount, _app_id, _player_id, _reward_id, 'CREDIT', 'SUCCESS', 'REWARD', null)
                        if (creditSuccess) {

                            let _updateQuery = {
                                text: "update tbl_reward_winners set is_claimed = true, claim_date = now() where rw_id = $1",
                                values: [_rw_id]
                            }

                            let updateResult = await pgConnection.executeQuery('loyalty', _updateQuery)

                            services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_SUCCESS");
                        } else {
                            services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_FAILED");
                        }
                    } else if (_reward_type.toUpperCase() == 'CASH') {


                        try {
                            let reedeemSuccess = await services.commonServices.reedeemCash(_rw_id, req.headers["access-token"], req.headers["x-naz-app-key"], 'rewards')

                            if (reedeemSuccess.Success) {

                                let _updateQuery = {
                                    text: "update tbl_reward_winners set is_claimed = true, claim_date = now() where rw_id = $1",
                                    values: [_rw_id]
                                }

                                let updateResult = await pgConnection.executeQuery('loyalty', _updateQuery)

                                services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_SUCCESS");

                            } else {
                                services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_FAILED");
                            }

                        } catch (error) {
                            logger.error('Reedeem Cash Error : ', error);
                            services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_FAILED");
                        }

                    } else {

                        let _updateQuery = {
                            text: "update tbl_reward_winners set status = 'PROCESSING' where rw_id = $1",
                            values: [_rw_id]
                        }
                        let updateResult = await pgConnection.executeQuery('loyalty', _updateQuery)
                        services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "CLAIM_PROCESS");
                    }
                }
                else {
                    services.sendResponse.sendWithCode(req, res, '', 'CONTEST_MESSAGE', "AlREADY_CLAIM");
                }

            } catch (error) {
                logger.error('Claim Rewards Error : ', error);
                services.sendResponse.sendWithCode(req, res, error, customMsgType, "GET_FAILED");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getWinner: async (req, res) => {
        console.log('getWinner');
        let _reward_id = req.body.reward_id ? req.body.reward_id : null;
        //  let resonse = await services.commonServices.testFun(_reward_id)

        services.commonServices.registerEventClaim(_reward_id).then(data => {
            res.send(data)
        }).catch(err => {
            res.send(err)
        })

    },

    getWinnersSummary: async (req, res) => {

        let _query = {
            text: "SELECT * from fn_get_winner_summary()",
            values: []
        }

        try {
            let dbResult = await pgConnection.executeQuery('loyalty', _query, true, 60 * 10)

            if (dbResult && dbResult.length > 0 && dbResult[0].data) {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            logger.error('getWinnersSummary Error : ', error);
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }

    },

    getWinnersHistory: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;

            let _query = {
                text: "SELECT * from fn_get_winner_history($1)",
                values: [_reward_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query, true, 60 * 10)

                if (dbResult && dbResult.length > 0 && dbResult[0].data) {
                    services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_FAILED");
                }
            }
            catch (error) {
                logger.error('getWinnersHistory Error : ', error);
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }

        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getPurchasedTickets: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id = req.appId;
            let _player_id = req.userDetails.playerId
            let _reward_id = req.body.reward_id ? req.body.reward_id : null;

            let _query = {
                text: "SELECT * from fn_get_purchasedtickets($1,$2)",
                values: [_player_id, _reward_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0 && dbResult[0].data) {

                    services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");

                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_FAILED");
                }
            }
            catch (error) {
                logger.error('getPurchasedTickets Error : ', error);
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getAllSocket: async (_app_id, callback) => {
        let _player_id
        let customResult;


        let _query = {
            text: "SELECT * from fn_get_rewards($1,$2,$3)",
            values: [null, null, 'ACTIVE']
        }

        let dbResult = await pgConnection.executeQuery('loyalty', _query)

        if (dbResult && dbResult.length > 0) {

            //  console.log('ALL ==', dbResult[0]);

            if (dbResult[0].data && dbResult[0].data.length > 0) {

                let rewardsData;
                let joinData;

                rewardsData = dbResult[0].data
                //   console.log('rewardsData ==', rewardsData);
                joinData = dbResult[1].data
                //  console.log('joinData ==', joinData);


                let rewardsDataLength = rewardsData.length

                for (let i = 0; i < rewardsDataLength; i++) {


                    rewardsData[i].show_reward = true
                    let startTime = new Date(rewardsData[i].from_date)
                    //    console.log('startTime', startTime);
                    let repeatMin = rewardsData[i].repeat_min

                    let endTime = new Date(startTime.getTime() + repeatMin * 60000);
                    let currentDate = new Date();
                    currentDate.setHours(currentDate.getHours() + 5);
                    currentDate.setMinutes(currentDate.getMinutes() + 30);
                    let remainingSeconds = services.commonServices.getTimeDiif(endTime, currentDate)


                    rewardsData[i].remaining_seconds = remainingSeconds

                    if (joinData) {
                        for (let joinCount = 0; joinCount < joinData.length; joinCount++) {
                            if (rewardsData[i].reward_id == joinData[joinCount].reward_id) {
                                rewardsData[i].joins = joinData[joinCount].join
                                break;
                            } else {
                                rewardsData[i].joins = 0
                            }
                        }
                    } else {
                        rewardsData[i].joins = 0
                    }

                    if (remainingSeconds < 0 && remainingSeconds >= -5) {

                        let _participantsCount = await services.commonServices.participantsCount(rewardsData[i].reward_id)
                        logger.info('Participants Count : ', _participantsCount, typeof _participantsCount)

                        if (parseInt(_participantsCount) > 0) {
                            let winner = await services.commonServices.declareWinner(rewardsData[i].reward_id)
                            logger.info('Reward Winner : ', winner)
                            rewardsData[i].winner = 'counting'
                        } else {
                            rewardsData[i].winner = null
                            rewardsData[i].show_reward = false
                            let _updateQuery = {
                                text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                                values: [rewardsData[i].reward_id]
                            }
                            pgConnection.executeQuery('loyalty', _updateQuery).then(
                                data => {
                                    let isGenerate = services.commonServices.genrateRewards(rewardsData[i].reward_id)
                                }).catch(err => {

                                })

                            /* services.commonServices.genrateRewards(rewardsData[i].reward_id).then(async isGenerate => {
                                if (isGenerate) {
                                    let _updateQuery = {
                                        text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                                        values: [rewardsData[i].reward_id]
                                    }

                                    let deactiveRewards = await pgConnection.executeQuery('loyalty', _updateQuery)
                                }
                            }) */
                        }

                    } else if (remainingSeconds < -5 && remainingSeconds >= -20) {

                        let _winQuery = {
                            text: "select * from fn_get_winner_detais($1)",
                            values: [rewardsData[i].reward_id]
                        }

                        let winResult = await pgConnection.executeQuery('loyalty', _winQuery)

                        if (winResult && winResult.length > 0 && winResult[0].data) {
                            rewardsData[i].winner = winResult[0].data[0]
                        } else {
                            let winner = await services.commonServices.declareWinner(rewardsData[i].reward_id)
                            rewardsData[i].winner = 'counting'
                        }

                    } else if (remainingSeconds < -20) {

                        rewardsData[i].show_reward = false
                        let _updateQuery = {
                            text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                            values: [rewardsData[i].reward_id]
                        }
                        pgConnection.executeQuery('loyalty', _updateQuery).then(
                            data => {
                                let isGenerate = services.commonServices.genrateRewards(rewardsData[i].reward_id)
                            }).catch(err => {

                            })

                    } else {
                        rewardsData[i].winner = null
                    }
                }
                callback(rewardsData);
            } else {
                callback([]);
            }
        } else {
            callback([]);
        }
    }
}