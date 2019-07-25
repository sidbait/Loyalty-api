const services = require('../../service/service');
const refModel = require('../../model/checkReferralModel');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

const rmg_api_url = 'http://rmg-api.carromclash.com/rmg/v1/claimEvent/'

var rp = require('request-promise');

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

                        if (goals && goals.length > 0) {
                            checkRegistration(goals);
                        }

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

            let goal = await refModel.getGoals(_player_id, _app_id, null);

            if (goal && goal.length > 0) {
                services.sendResponse.sendWithCode(req, res, goal, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, { err: 'no goal found' }, customMsgType, "GET_FAILED");
            }

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

                if (goal && goal.length > 0) {
                    let referred_by = goal[0].referred_by;
                    let total_amount_earned_by_referral = await refModel.amountEarned(referred_by, _app_id, null);

                    console.log('total_amount_earned_by_referral ==>', total_amount_earned_by_referral);

                    if (goal[0].is_goal_achieved == false && total_amount_earned_by_referral <= 100) {
                        console.log('Goal need to achived');

                        if (_goal_code == 'GAMEPLAY') {

                            let x = checkGamePlay(goal[0])

                            // console.log(JSON.parse(x).data);
                        } else if (_goal_code == 'DEPOSIT') {

                            let x = checkDeposit(goal[0])

                        } else {
                            console.log('new goal code ', _goal_code);
                        }

                    } else {
                        console.log('no Goal to achived');
                    }
                    services.sendResponse.sendWithCode(req, res, goal, customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, { err: 'no goal found' }, customMsgType, "GET_FAILED");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    amountEarned: async function (req, res) {

        let _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
        let _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

        console.log('_app_id', _app_id);
        console.log('_player_id', _player_id);

        if (_app_id && _player_id) {
            // total amount earned by referral
            let total_amount_earned_by_referral = await refModel.amountEarned(_player_id, _app_id, null);


            services.sendResponse.sendWithCode(req, res, { total_amount_earned_by_referral }, customMsgType, "GET_SUCCESS");

        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    getReferralDetail: async function (req, res) {

        let _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
        let _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);

        console.log('_app_id', _app_id);
        console.log('_player_id', _player_id);

        if (_app_id && _player_id) {

            let total_amount_earned_by_referral = await refModel.amountEarned(_player_id, _app_id, null);
            let referralDetail = await refModel.getReferralDetail(_player_id, _app_id, null);

            services.sendResponse.sendWithCode(req, res, { total_amount_earned_by_referral, referralDetail }, customMsgType, "GET_SUCCESS");

        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

        }
    },
}


async function checkRegistration(myGoal) {

    myGoal.map(async element => {
        if (element.goal_code == 'REGISTRATION' && element.is_goal_achieved == false) {
            console.log(`send reward_amount ${element.reward_amount} to referred_by ${element.referred_by}`);
            try {

                let player_mobile = await refModel.getMobile(element.player_id);
                let referBy_mobile = await refModel.getMobile(element.referred_by);

                let url = rmg_api_url + 'registration';

                let body =
                {
                    player_mobile: player_mobile,
                    reward_amount: element.reward_amount,
                    referBy_mobile: referBy_mobile
                }


                let d = await rmgCall(url, body)
                console.log(JSON.parse(d));
                let x = JSON.parse(d);
                if (x.data && x.data.isCredited == true) {
                    // update in ref trns tbl
                    let new_reward_amount = x.data.reward_amount;
                    let isCredited = await refModel.updateReferrerPlayerTransaction(element.player_id, 'REGISTRATION', new_reward_amount)
                    console.log('isCredited ==>', isCredited);
                }


            } catch (error) {
                console.log(error);
            }
        }
    })
}

async function checkGamePlay(myGoal) {
    let player_id = myGoal.player_id;
    let app_id = myGoal.app_id;
    let referred_by = myGoal.referred_by;

    let reward_amount = myGoal.reward_amount;
    let goal_achieved_from = myGoal.goal_achieved_from;
    let goal_achieved_to = myGoal.goal_achieved_to;
    let expiry_date = myGoal.expiry_date;
    return new Promise(async function (resolve, reject) {
        try {

            let player_mobile = await refModel.getMobile(player_id);
            let referBy_mobile = await refModel.getMobile(referred_by);

            let url = rmg_api_url + 'gameplay';

            let body =
            {
                player_mobile: player_mobile,
                count: goal_achieved_to,
                reward_amount: reward_amount,
                referBy_mobile: referBy_mobile
            }


            let d = await rmgCall(url, body)
            console.log(JSON.parse(d));
            let x = JSON.parse(d);
            if (x.data && x.data.isCredited == true) {
                // update in ref trns tbl
                let new_reward_amount = x.data.reward_amount;
                let isCredited = await refModel.updateReferrerPlayerTransaction(player_id, 'GAMEPLAY', new_reward_amount)
                console.log('isCredited ==>', isCredited);
            }

        } catch (error) {
            console.log(error);
            reject(error)

        }
    });

}

async function checkDeposit(myGoal) {

    let player_id = myGoal.player_id;
    let app_id = myGoal.app_id;
    let referred_by = myGoal.referred_by;

    let reward_amount = myGoal.reward_amount;
    let goal_achieved_from = myGoal.goal_achieved_from;
    let goal_achieved_to = myGoal.goal_achieved_to;
    let expiry_date = myGoal.expiry_date;
    let minimumAmount = myGoal.minimum_amount;
    let is_percentage = myGoal.is_percentage;

    return new Promise(async function (resolve, reject) {
        try {

            let player_mobile = await refModel.getMobile(player_id);
            let referBy_mobile = await refModel.getMobile(referred_by);

            let url = rmg_api_url + 'deposit';

            let body =
            {
                player_mobile: player_mobile,
                count: goal_achieved_to,
                reward_amount: reward_amount,
                referBy_mobile: referBy_mobile,
                minimumAmount: minimumAmount,
                is_percentage: is_percentage
            }

            let d = await rmgCall(url, body)
            console.log(JSON.parse(d));
            let x = JSON.parse(d);
            if (x.data && x.data.isCredited == true) {
                let new_reward_amount = x.data.reward_amount;
                let isCredited = await refModel.updateReferrerPlayerTransaction(player_id, 'DEPOSIT', new_reward_amount)
                console.log('isCredited ==>', isCredited);
            }

        } catch (error) {
            console.log(error);
            reject(error)

        }
    });
}

function rmgCall(url, body) {

    var options = {
        method: 'POST',
        url: url,
        headers:
        {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: body
    };

    return new Promise(async function (resolve, reject) {
        rp(options)
            .then(function (parsedBody) {
                // POST succeeded...
                console.log('POST succeeded...');
                resolve(parsedBody)

            })
            .catch(function (err) {
                // POST failed...
                console.log('POST failed...');
                reject(err)
            });
    });

}