const services = require('../../service/service');
const refModel = require('../../model/checkReferralModel');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    onRegistration: async function (playerId, appId, inviteCode) {

        if (playerId) {

            let playerData = await refModel.getPlayerData(playerId, null, appId);

            console.log('refcode => ', playerData[0].refcode);


            if (playerData && playerData.length > 0) {

                if (playerData[0].refcode == null) {

                    let isSuccess = await refModel.genAndInsertRefCode(playerId);

                    console.log('genAndInsertRefCode => ', isSuccess);

                }

                // get referByPlayer details from mongo using inviteCode
                if (inviteCode) {

                    console.log('inviteCode => ', inviteCode);

                    let referBy = await refModel.getReferByPlayer(inviteCode, null, appId);

                    if (referBy && referBy.playerId && referBy.appId) {
                        console.log('referBy.playerId => ', referBy.playerId, 'referBy.appId => ', referBy.appId);
                        let goals = await refModel.checkGoal(playerId, referBy.playerId, referBy.appId);

                        console.log('goals =>', goals);
                    } else {
                        console.log('wrong inviteCode');
                    }

                } else {
                    console.log('no inviteCode');
                }

            } else {
                console.log('no playerData');
            }

        } else {
            console.log('no player_id');
        }

        console.log('========== Ref Done ==============');
    },

    getInviteCode: async function (req, res) {

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

            if (_app_id && _player_id) {

                let op = await refModel.getInviteCode(_app_id, _player_id)

                services.sendResponse.sendWithCode(req, res, op, customMsgType, "GET_SUCCESS");
            } else {
                let valErr = {
                    "err": [
                        "Invalid App Key or access-token"
                    ]
                }
                services.sendResponse.sendWithCode(req, res, valErr, customMsgTypeCM, "VALIDATION_FAILED");

            }

        } catch (error) {
            console.log(error);

            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "VALIDATION_FAILED");
        }

    },

    submitRefCode: async (req, res) => {

        let rules = {
            "refcode": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            let _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);
            let _refcode = req.body.refcode ? req.body.refcode : null;

            console.log('_app_id', _app_id);
            console.log('_player_id', _player_id);
            console.log('_refcode', _refcode);

            if (_app_id && _player_id) {

                let referBy = await refModel.getReferByPlayer(null, _refcode, _app_id);

                if (referBy) {
                    let op = {};
                    console.log('referBy.playerId => ', referBy.playerId, 'referBy.appId => ', referBy.appId);
                    if (_player_id != referBy.playerId) {
                        let goals = await refModel.checkGoal(_player_id, referBy.playerId, referBy.appId);

                        console.log('goals =>', goals);

                        services.sendResponse.sendWithCode(req, res, goals, customMsgType, "GET_SUCCESS");
                    } else {
                        op = {
                            err: 'same referBy.playerId and playerId'
                        }
                        services.sendResponse.sendWithCode(req, res, op, customMsgType, "GET_FAILED");
                    }

                } else {
                    services.sendResponse.sendWithCode(req, res, { err: 'wrong code' }, customMsgType, "GET_FAILED");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }

    },

    claimEventList: async function (req, res) {

        let _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
        let _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

        console.log('_app_id', _app_id);
        console.log('_player_id', _player_id);

        if (_app_id && _player_id) {

            let op = await refModel.getGoals(_player_id, _app_id)
            services.sendResponse.sendWithCode(req, res, op, customMsgType, "GET_SUCCESS");

        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    claimEvent: async function (req, res) {
        let rules = {
            "goal_code": 'required',
        };
        console.log(req.body);

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            let _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);
            let _goal_code = req.body.goal_code ? req.body.goal_code : null;

            console.log('_app_id', _app_id);
            console.log('_player_id', _player_id);
            console.log('_goal_code', _goal_code);

            if (_app_id && _player_id) {

                let goal = await refModel.getGoals(_player_id, _app_id, _goal_code);

                console.log(goal.length > 0, goal[0].goal_achieved);

                if (goal && goal.length > 0 && goal[0].goal_achieved == 'false') {
                    console.log('Goal need to achived');

                    if (_goal_code == 'GAMEPLAY') {
                        let x = checkGamePlay(goal[0])
                    } else if (_goal_code == 'DEPOSIT') {

                    } else {
                        console.log('new goal code ', _goal_code);
                    }

                } else {
                    console.log('no Goal to achived');
                }

                services.sendResponse.sendWithCode(req, res, goal, customMsgType, "GET_SUCCESS");

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }
    },
}


function checkGamePlay(myGoal) {
    let player_id = myGoal.player_id;
    let app_id = myGoal.app_id;
    let referred_by = myGoal.referred_by;
    let goal_code = myGoal.goal_code;
    let goal_achieved = myGoal.goal_achieved;
    let reward_amount = myGoal.reward_amount;
    let goal_achieved_from = myGoal.goal_achieved_from;
    let goal_achieved_to = myGoal.goal_achieved_to;
    let expiry_date = myGoal.expiry_date;

    
}