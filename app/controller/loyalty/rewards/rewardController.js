const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getAll: async (req, res) => {

        console.log(req.headers);

        let _player_id;
        let _app_id;
        let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;
        let _status = req.body.status ? req.body.status.toUpperCase() : null;

        let customResult;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

        } catch (error) {
            _app_id = null
            _player_id = null;
        }

        if (_player_id && _app_id) {

            let _query = {
                text: "SELECT * from fn_get_rewards($1,$2,$3)",
                values: [_player_id, _reward_id, _status]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {

                    console.log('ALL ==', dbResult[0]);

                    if (dbResult[0].data && dbResult[0].data.length > 0) {

                        let rewardsData;
                        let joinData;

                        rewardsData = dbResult[0].data
                        console.log('rewardsData ==', rewardsData);
                        joinData = dbResult[1].data
                        console.log('joinData ==', joinData);


                        let rewardsDataLength = rewardsData.length

                        for (let i = 0; i < rewardsDataLength; i++) {

                            let startTime = new Date(rewardsData[i].from_date)
                            console.log('startTime', startTime);
                            let repeatMin = rewardsData[i].repeat_min

                            let endTime = new Date(startTime.getTime() + repeatMin * 60000);
                            let currentDate = new Date();
                            currentDate.setHours(currentDate.getHours() + 5);
                            currentDate.setMinutes(currentDate.getMinutes() + 30);
                            let remainingSeconds = services.commonServices.getTimeDiif(endTime, currentDate)

                            console.log('endTime', endTime);
                            console.log('remainingSeconds', endTime, currentDate, remainingSeconds);
                            rewardsData[i].remaining_seconds = remainingSeconds
                            rewardsData[i].winner = null

                            for (let joinCount = 0; joinCount && joinCount < joinData.length; joinCount++) {
                                if (rewardsData[i].reward_id == joinData[joinCount].reward_id) {
                                    rewardsData[i].joins = joinData[joinCount].join
                                }
                            }
                        }

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

                console.log(error);
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid Access Token or App Key', customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    rewardParticipate: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id;
            let _player_id;
            let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;
            let _ticket_code = req.body.ticket_code ? req.body.ticket_code : null;
            let _txn_status = req.body.txn_status ? req.body.txn_status.toUpperCase() : 'ACTIVE';
            let _count = req.body.count ? req.body.count : 1;

            let walletBal;
            let rewardBuyAmt;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                try {
                    walletBal = await services.commonServices.getWalletBalance(_player_id)
                    rewardBuyAmt = await services.commonServices.getRewardBuyAmt(_reward_id)
                } catch (error) {
                    walletBal = 0
                    rewardBuyAmt = null
                }

                if (walletBal >= (rewardBuyAmt * _count)) {

                    let dbResultArr = [];
                    for (let count = 0; count < _count; count++) {

                        let _walletBal = await services.commonServices.getWalletBalance(_player_id)
                        let debitSuccess;

                        console.log('player_id', typeof _player_id, _player_id);

                        console.log('player_id', typeof _reward_id, _reward_id);

                        try {
                            debitSuccess = await services.commonServices.walletTransaction(rewardBuyAmt, _app_id, _player_id, _reward_id, 'DEBIT', 'SUCCESS', 'REWARD')
                        } catch (error) {
                            console.log(error);

                            debitSuccess = false
                        }

                        console.log('debitSuccess', debitSuccess);


                        if (debitSuccess) {
                            _ticket_code = services.commonServices.randomString(10)

                            let _query = {
                                text: "SELECT * from fn_reward_participate($1,$2,$3,$4)",
                                values: [_player_id, _reward_id, _ticket_code, _txn_status]
                            }

                            let dbResult = await pgConnection.executeQuery('loyalty', _query)
                            console.log('fn_reward_participate', dbResult);
                            dbResultArr.push(dbResult[0])

                        }
                    }

                    console.log("dbResultArr=============");
                    console.log(dbResultArr);


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
                services.sendResponse.sendWithCode(req, res, 'Invalid Access Token', customMsgTypeCM, "INVALID_ACCESS_TOKEN");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getWinner: async (req, res) => {
        console.log('getWinner');
        let _reward_id = req.body.reward_id ? parseInt(req.body.reward_id) : null;
        let resonse = await services.commonServices.testFun(_reward_id)


        res.send(resonse)
    },

    getPurchasedTickets: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id;
            let _player_id;
            let _reward_id = req.body.reward_id ? req.body.reward_id : null;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                let _query = {
                    text: "SELECT * from fn_get_purchasedtickets($1,$2)",
                    values: [_player_id, _reward_id]
                }

                try {
                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    console.log('dbResult', dbResult);

                    if (dbResult && dbResult.length > 0 && dbResult[0].data) {

                        services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_SUCCESS");

                    } else {
                        services.sendResponse.sendWithCode(req, res, dbResult[0].data, customMsgType, "GET_FAILED");
                    }
                }
                catch (error) {
                    services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
                }


            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid Access Token', customMsgTypeCM, "VALIDATION_FAILED");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getAllSocket: async (_app_id, callback) => {
        let _player_id;
        let customResult;


        let _query = {
            text: "SELECT * from fn_get_rewards($1,$2,$3)",
            values: [null, null, 'ACTIVE']
        }

        let dbResult = await pgConnection.executeQuery('loyalty', _query)

        if (dbResult && dbResult.length > 0) {

            console.log('ALL ==', dbResult[0]);

            if (dbResult[0].data && dbResult[0].data.length > 0) {

                let rewardsData;
                let joinData;

                rewardsData = dbResult[0].data
                console.log('rewardsData ==', rewardsData);
                joinData = dbResult[1].data
                console.log('joinData ==', joinData);


                let rewardsDataLength = rewardsData.length

                for (let i = 0; i < rewardsDataLength; i++) {

                    let startTime = new Date(rewardsData[i].from_date)
                    console.log('startTime', startTime);
                    let repeatMin = rewardsData[i].repeat_min

                    let endTime = new Date(startTime.getTime() + repeatMin * 60000);
                    let currentDate = new Date();
                    currentDate.setHours(currentDate.getHours() + 5);
                    currentDate.setMinutes(currentDate.getMinutes() + 30);
                    let remainingSeconds = services.commonServices.getTimeDiif(endTime, currentDate)

                    console.log('endTime', endTime);
                    console.log('remainingSeconds', endTime, currentDate, remainingSeconds);

                    rewardsData[i].remaining_seconds = remainingSeconds


                    for (let joinCount = 0; joinCount && joinCount < joinData.length; joinCount++) {
                        if (rewardsData[i].reward_id == joinData[joinCount].reward_id) {
                            rewardsData[i].joins = joinData[joinCount].join
                        }
                    }

                    if (remainingSeconds < 0 && remainingSeconds >= -5) {
                       /*  if (participants) { */
                            let winner = await services.commonServices.declareWinner(rewardsData[i].reward_id)
                            rewardsData[i].winner = 'counting'
                        /* } else {
                            rewardsData[i].winner = null
                            services.commonServices.genrateRewards(rewardsData[i].reward_id).then(isGenerate => {
                                if (isGenerate) {
                                    let _updateQuery = {
                                        text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                                        values: [rewardsData[i].reward_id]
                                    }

                                    let deactiveRewards = await pgConnection.executeQuery('loyalty', _updateQuery)
                                }
                            })
                        } */

                    } else if (remainingSeconds < -5 && remainingSeconds >= -10) {

                        let _winQuery = {
                            text: "select * from fn_get_winner_detais($1)",
                            values: [rewardsData[i].reward_id]
                        }

                        let winResult = await pgConnection.executeQuery('loyalty', _winQuery)

                        if (winResult && winResult.length > 0 && winResult[0].data) {
                            rewardsData[i].winner = winResult[0].data
                        } else {
                            let winner = await services.commonServices.declareWinner(rewardsData[i].reward_id)
                            rewardsData[i].winner = 'counting'
                        }

                    } else if (remainingSeconds < -10) {

                        services.commonServices.genrateRewards(rewardsData[i].reward_id).then(async (isGenerate) => {
                            if (isGenerate) {
                                let _updateQuery = {
                                    text: "update tbl_reward set status='DEACTIVE' where reward_id= $1",
                                    values: [rewardsData[i].reward_id]
                                }

                                let deactiveRewards = await pgConnection.executeQuery('loyalty', _updateQuery)
                            }
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