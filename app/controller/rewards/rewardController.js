const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getAll: async (req, res) => {

        console.log(req.headers);

        let _player_id;
        let _app_id;
        let _reward_id = req.body.reward_id ? req.body.reward_id : null;
        let _status = req.body.status ? req.body.status.toUpperCase() : null;

        let customResult;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);
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

                            for (let joinCount = 0; joinCount < joinData.length; joinCount++) {
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
            let _reward_id = req.body.reward_id ? req.body.reward_id : null;
            let _ticket_code = req.body.ticket_code ? req.body.ticket_code : null;
            let _txn_status = req.body.txn_status ? req.body.txn_status.toUpperCase() : 'ACTIVE';
            let _count = req.body.count ? req.body.count : 1;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                _ticket_code = services.commonServices.randomString(10)

                let _query = {
                    text: "SELECT * from fn_reward_participate($1,$2,$3,$4)",
                    values: [_player_id, _reward_id, _ticket_code, _txn_status]
                }

                try {

                    let dbResultArr = [];
                    for (let count = 0; count < _count; count++) {
                        let dbResult = await pgConnection.executeQuery('loyalty', _query)
                        dbResultArr.push(dbResult[0])
                    }

                    if (dbResultArr && dbResultArr.length > 0) {
                        services.sendResponse.sendWithCode(req, res, dbResultArr, customMsgType, "GET_SUCCESS");

                    } else {
                        services.sendResponse.sendWithCode(req, res, dbResultArr, customMsgType, "GET_FAILED");
                    }
                }
                catch (error) {

                    console.log(error);

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

    getWinner: async (req, res) => {
        let rules = {
            "reward_id": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {
            let _app_id;
            let _player_id;
            let _reward_id = req.body.reward_id ? req.body.reward_id : null;
            let _ticket_code = req.body.ticket_code ? req.body.ticket_code : null;
            let _status = req.body.status ? req.body.status.toUpperCase() : 'ACTIVE';

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);
                _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            } catch (error) {
                _app_id = null;
                _player_id = null;
            }

            if (_player_id) {

                let _query = {
                    text: "SELECT * from fn_reward_participate($1,$2,$3,$4)",
                    values: [_player_id, _reward_id, _ticket_code, _status]
                }

                try {
                    let dbResult = await pgConnection.executeQuery('loyalty', _query)


                    if (dbResult && dbResult.length > 0) {

                        services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_SUCCESS");

                    } else {
                        services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
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
                _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);
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
    }

}