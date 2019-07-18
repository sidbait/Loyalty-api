const pgConnection = require('../../model/pgConnection');
const mongodb = require('../../model/mongoConnectionPromise');
const services = require('../../service/service');
const refModel = require('../../model/checkReferralModel');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    onRegistration: async function (req, res) {
        let playerId = req.query.playerId ? req.query.playerId : null;
        let inviteCode = req.query.inviteCode ? req.query.inviteCode : null;

        if (playerId) {

            let playerData = await refModel.getPlayerData(playerId, null, null);

            console.log('refcode => ', playerData[0].refcode);


            if (playerData && playerData.length > 0) {

                if (playerData[0].refcode == null) {

                    let isSuccess = await refModel.genAndInsertRefCode(player_id);

                    console.log('genAndInsertRefCode => ', isSuccess);

                }

                // get referByPlayer details from mongo using inviteCode
                if (inviteCode) {

                    let referBy = await refModel.getReferByPlayer(inviteCode, null);

                    if (referBy) {
                        console.log('referBy.player_id => ', referBy.player_id, 'referBy.app_id => ', referBy.app_id);

                        let reward_amount = await refModel.checkGoal(player_id, referBy.player_id, referBy.app_id, 'REGISTRATION');

                        console.log('reward_amount =>', reward_amount);
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

        res.send('ok')
    },

    onDeposit: async function (req, res) {
        let playerId = req.query.playerId ? req.query.playerId : null;
        let appId = req.query.appId ? req.query.appId : null;

        console.log('playerId => ', playerId, 'appId => ', appId);

        if (playerId && appId) {

            let playerData = await refModel.getPlayerData(playerId, null, null);

            if (playerData && playerData.length > 0) {

                // get referByPlayer details from pg using inviteCode
                if (playerData[0].player_id) {



                } else {
                    console.log('no player_id');
                }

            } else {
                console.log('no playerData');
            }

        } else {
            console.log('no appPlayerId && appId');
        }

        res.send('ok')
    },

    getInviteCode: async function (req, res) {

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            _player_id = await services.commonServices.getPlayerIdByToken(req.headers["access-token"], _app_id);
        } catch (error) {
            _app_id = null;
            _player_id = null;
        }

        // let rules = {
        //     "player_id": 'required',
        //     "app_id": 'required',
        // };

        // console.log(_app_id,_player_id);
        // res.send('ok');

        // let validation = new services.validator(req.body, rules);

        if (_app_id && _player_id) {

            // let _app_id = req.body.app_id ? req.body.app_id : null;;
            // let _player_id = req.body.player_id ? req.body.player_id : null;

            console.log('_app_id', _app_id);
            console.log('_player_id', _player_id);

            if (_app_id && _player_id) {

                let op = await refModel.getInviteCode(_app_id, _player_id)

                services.sendResponse.sendWithCode(req, res, op, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, {}, customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    submitRefCode: async (req, res) => {

        let rules = {
            "player_id": 'required',
            "app_id": 'required',
            "refcode": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _app_id = req.body.app_id ? req.body.app_id : null;;
            let _player_id = req.body.player_id ? req.body.player_id : null;
            let _refcode = req.body.refcode ? req.body.refcode : null;

            console.log('_app_id', _app_id);
            console.log('_player_id', _player_id);
            console.log('_refcode', _refcode);

            if (_app_id && _player_id) {

                let referBy = await refModel.getReferByPlayer(null, _refcode);

                if (referBy) {

                    console.log('referBy.playerId => ', referBy.playerId, 'referBy.appId => ', referBy.appId);

                    let goals = await refModel.checkGoal(_player_id, referBy.playerId, referBy.appId);

                    console.log('goals =>', goals);

                    let op = {
                        referBy: referBy.playerId,
                        event: 'REGISTRATION',
                        goals: goals
                    }

                    services.sendResponse.sendWithCode(req, res, op, customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, { err: 'wrong code' }, customMsgType, "GET_SUCCESS");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key or PlayerId', customMsgTypeCM, "VALIDATION_FAILED");

            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }

    }
}