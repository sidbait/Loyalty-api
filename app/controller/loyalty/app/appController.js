const pgConnection = require('../../../model/pgConnection');
const services = require('../../../service/service');
const md5 = require('md5');
const jwtToken = require('../../../auth/jwtToken');

const checkReferralController = require('../../../controller/referral/checkReferralController');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";
const customRegMsgType = "LOGIN_MESSAGE";

module.exports = {

    register: async function (req, res) {

        let rules = {
            "mobile_number": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _mobile_number = req.body.mobile_number ? req.body.mobile_number : null;
            let _user_name = req.body.user_name ? req.body.user_name : null;
            let _email_id = req.body.email_id ? req.body.email_id : null;
            let _status = 'ACTIVE';
            let _source = req.body.source ? req.body.source : null;
            let _app_id;
            let _device_id = req.body.device_id ? req.body.device_id : null;
            let _app_player_id = req.body.app_player_id ? req.body.app_player_id : null;
            let _fcm_id = req.body.fcm_id ? req.body.fcm_id : null;
            let _app_fb_id = req.body.app_fb_id ? req.body.app_fb_id : null;
            let _app_google_id = req.body.app_google_id ? req.body.app_google_id : null;
            let nz_access_token = null

            let inviteCode = req.body.inviteCode ? req.body.inviteCode : null;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);

            } catch (error) {
                _app_id = null;
            }


            if (_app_id) {


                let _query = {
                    text: "select * from fn_register_player($1,$2, $3, $4,$5,$6,$7,$8,$9,$10,$11,$12)",
                    values: [_mobile_number, _user_name, _email_id, _status, _source, _app_id, _device_id, _app_player_id, _fcm_id, nz_access_token, _app_fb_id, _app_google_id]
                }

                let customResponse = {
                    accessToken: null,
                    playerId: null
                }

                try {

                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult.length > 0) {

                        console.log(dbResult[0].p_out_player_id);

                        let tempRes = dbResult[0].p_out_player_id.split('|')
                        let _response = tempRes[0] ? tempRes[0].trim() : tempRes[0]

                        console.log(_response == 'SUCCESS_REGISTERD');

                        console.log(
                            'req.query: ' + JSON.stringify(req.query) + '\n' +
                            'req.body: ' + JSON.stringify(req.body)
                        )

                        let _player_id = tempRes[1]
                        let _player_app_id = tempRes[2]

                        if (_response == 'SUCCESS_REGISTERD') {

                            let tokenParam = {
                                playerId: _player_id,
                                appId: _app_id
                            }

                            nz_access_token = jwtToken.generateToken(tokenParam);

                            let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_app_id = ${_player_app_id} returning *`;

                            let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)

                            if (updateResult && updateResult.length > 0) {

                                customResponse.accessToken = nz_access_token
                                customResponse.playerId = _player_id
                                services.sendResponse.sendWithCode(req, res, customResponse, customRegMsgType, "USER_REGISTERED_SUCCESS");
                                checkReferralController.onRegistration(_player_id, _app_id, inviteCode);
                            }

                        } else if (_response == 'USER_APP_REGISTERD') {

                            let tokenParam = {
                                playerId: _player_id,
                                appId: _app_id
                            }

                            nz_access_token = jwtToken.generateToken(tokenParam);

                            let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_app_id = ${_player_app_id} returning *`;

                            let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)

                            if (updateResult && updateResult.length > 0) {

                                customResponse.accessToken = nz_access_token
                                customResponse.playerId = _player_id
                                services.sendResponse.sendWithCode(req, res, customResponse, customRegMsgType, "USER_REGISTERED_SUCCESS");
                            }

                        } else {

                            let _tokenQuery = {
                                text: "select nz_access_token from tbl_player_app where player_id = $1 and app_id = $2 limit 1",
                                values: [tempRes[1], _app_id]
                            }

                            let tokenResult = await pgConnection.executeQuery('loyalty', _tokenQuery)
                            console.log('tokenResult', tokenResult);
                            customResponse.playerId = tempRes[1]
                            customResponse.accessToken = tokenResult[0].nz_access_token
                            console.log('USER_ALREADY_REGISTERD', customResponse);
                            services.sendResponse.sendWithCode(req, res, customResponse, customRegMsgType, "USER_ALREADY_REGISTERD");
                        }

                    }
                }

                catch (dbError) {
                    console.log(dbError);
                    services.sendResponse.sendWithCode(req, res, customResponse, "COMMON_MESSAGE", "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key', customMsgTypeCM, "VALIDATION_FAILED");

            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    otpLogin: async (req, res) => {
        let rules = {
            "mobile_number": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _mobile_number = req.body.mobile_number ? req.body.mobile_number : null;
            let _user_name = req.body.user_name ? req.body.user_name : null;
            let _email_id = req.body.email_id ? req.body.email_id : null;
            let _status = 'ACTIVE';
            let _source = req.body.source ? req.body.source : null;
            let _app_id;
            let _device_id = req.body.device_id ? req.body.device_id : null;
            let _app_player_id = req.body.app_player_id ? req.body.app_player_id : null;
            let _fcm_id = req.body.fcm_id ? req.body.fcm_id : null;
            let _app_fb_id = req.body.app_fb_id ? req.body.app_fb_id : null;
            let _app_google_id = req.body.app_google_id ? req.body.app_google_id : null;
            let _app_hash = req.body.app_hash ? req.body.app_hash : null;
            let nz_access_token = null

            let inviteCode = req.body.inviteCode ? req.body.inviteCode : null;

            try {
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            } catch (error) {
                _app_id = null;
            }

            if (_app_id) {

                let _query = {
                    text: "select * from fn_register_player($1,$2, $3, $4,$5,$6,$7,$8,$9,$10,$11,$12)",
                    values: [_mobile_number, _user_name, _email_id, _status, _source, _app_id, _device_id, _app_player_id, _fcm_id, nz_access_token, _app_fb_id, _app_google_id]
                }

                let customResponse = {
                    accessToken: null,
                    playerId: null
                }

                try {

                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult.length > 0) {

                        console.log(dbResult[0].p_out_player_id);

                        let tempRes = dbResult[0].p_out_player_id.split('|')
                        let _response = tempRes[0] ? tempRes[0].trim() : tempRes[0]

                        console.log(_response == 'SUCCESS_REGISTERD');

                        let _player_id = parseInt(tempRes[1])
                        let _player_app_id = tempRes[2]
                        let _otp_number = services.commonServices.otpNumber()
                        let _sms_id = null

                        if (_response == 'SUCCESS_REGISTERD') {
                            /* let _player_id = tempRes[1]
                            let _player_app_id = tempRes[2] */

                            let tokenParam = {
                                playerId: _player_id,
                                appId: _app_id
                            }

                            nz_access_token = jwtToken.generateToken(tokenParam);

                            let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_app_id = ${_player_app_id} returning *`;

                            let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)


                        } else if (_response == 'USER_APP_REGISTERD') {

                            let tokenParam = {
                                playerId: _player_id,
                                appId: _app_id
                            }

                            nz_access_token = jwtToken.generateToken(tokenParam);

                            let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_app_id = ${_player_app_id} returning *`;

                            let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)

                        }

                        let otpQuery = {
                            text: "select * from fn_generate_otp($1,$2,$3,$4)",
                            values: [_player_id, _sms_id, _otp_number,_app_id]
                        }

                        let otpResult = await pgConnection.executeQuery('loyalty', otpQuery)

                        let msg = "<%2523> Enter OTP " + _otp_number + " for Loyalty KYC and You are one step away from winning real cash!! Click https://bigpesa.in to earn real cash." + (_app_hash ? _app_hash : ''); 

                       /*  msg = `Congratulations, Enter OTP ${_otp_number} for Loyalty KYC and you are one step away from winning Exciting Prizes. ${_app_hash ? _app_hash : ''}` */

                        services.commonServices.sendSMS(msg,_mobile_number)

                        services.sendResponse.sendWithCode(req, res, otpResult[0], customMsgType, "GET_SUCCESS");

                    }
                }

                catch (dbError) {
                    console.log(dbError);
                    services.sendResponse.sendWithCode(req, res, customResponse, "COMMON_MESSAGE", "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key', customMsgTypeCM, "VALIDATION_FAILED");

            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    otpVerify: async (req, res) => {
        let rules = {
            "otp_pin": 'required',
            "mobile_number": 'required'
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _otp_pin = req.body.otp_pin ? req.body.otp_pin : null;
            let _mobile = req.body.mobile_number ? req.body.mobile_number : null;
            let _player_id, _app_id;

            try {
                _player_id = await services.commonServices.getPlayerIdByMobile(_mobile);
                _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);
            } catch (error) {
                _player_id = null;
                _app_id = null;
            }


            if (_player_id && _app_id) {

                let _query = {
                    text: "select * from fn_otp_verify($1,$2,$3)",
                    values: [_player_id, _otp_pin, _app_id]
                }

                try {

                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult.length > 0 && dbResult[0].p_out_verify_success) {

                        let _playerQuery = {
                            text: "SELECT * from fn_get_player_details($1,$2)",
                            values: [_player_id, _app_id]
                        }

                        let playerResult = await pgConnection.executeQuery('loyalty', _playerQuery)

                        console.log(playerResult[0].data);
                        

                        services.sendResponse.sendWithCode(req, res, playerResult[0].data[0], customRegMsgType, "OTP_SUCCESS");

                    } else {
                        services.sendResponse.sendWithCode(req, res, '', customRegMsgType, "INVALID_OTP");
                    }

                } catch (dbError) {
                    console.log(dbError);
                    services.sendResponse.sendWithCode(req, res, dbError, "COMMON_MESSAGE", "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid Access Token or App Key', customMsgTypeCM, "VALIDATION_FAILED");
            }

        } else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }

    },

    getDetails: async function (req, res) {
        let _app_id;
        let customResult;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["x-naz-app-key"]);

        } catch (error) {
            _app_id = null;
        }


        if (_app_id) {
            //  let _selectQuery = 'SELECT * from fn_get_app($1,$2)'
            let _query = {
                text: "SELECT * from fn_get_app($1)",
                values: [_app_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {

                    customResult = dbResult[0].data[0];
                    customResult.events = dbResult[1].data;

                    services.sendResponse.sendWithCode(req, res, customResult, customMsgType, "GET_SUCCESS");

                    /*  services.sendResponse.sendreq.body.txn_type ? req.body.txn_type : nullWithCode(req, res, customResult, customMsgType, "GET_SUCCESS"); */
                } else {


                    services.sendResponse.sendWithCode(req, res, customResult, customMsgType, "GET_FAILED");

                    /*  req.body.txn_type ? req.body.txn_type : null
                     services.sendResponse.sendreq.body.txn_type ? req.body.txn_type : nullWithCode(req, res, dbResult, customMsgType, "GET_FAILED"); */
                }
            }
            catch (error) {
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }
        } else {
            services.sendResponse.sendWithCode(req, res, 'Invalid App Key', customMsgTypeCM, "VALIDATION_FAILED");

        }
    },


    generateToken: async (req, res) => {

        let _player_id = req.body.player_id
        let _app_id = req.appId

        let tokenParam = {
            playerId: _player_id,
            appId: _app_id
        }
        let customResponse = {};

        let nz_access_token = jwtToken.generateToken(tokenParam);

        let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_id = ${_player_id} and app_id = ${_app_id} returning *`;

        let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)

        if (updateResult && updateResult.length > 0) {

            customResponse.accessToken = nz_access_token
            customResponse.playerId = _player_id

            services.sendResponse.sendWithCode(req, res, customResponse, customRegMsgType, "USER_REGISTERED_SUCCESS");

        }
    }

}