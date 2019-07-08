const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');
const md5 = require('md5');
const jwtToken = require('../../auth/jwtToken');

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

            try {
                _app_id = await services.commonServices.getAppId(req.headers["app-key"]);

            } catch (error) {
                _app_id = null;
            }


            if (_app_id) {


                let _query = {
                    text: "select * from fn_register_player($1,$2, $3, $4,$5,$6,$7,$8,$9,$10,$11,$12)",
                    values: [_mobile_number, _user_name, _email_id, _status, _source, _app_id, _device_id, _app_player_id, _fcm_id, nz_access_token, _app_fb_id, _app_google_id]
                }

                let response = {
                    accessToken: null,
                    playerId: null
                }

                try {

                    let dbResult = await pgConnection.executeQuery('loyalty', _query)

                    if (dbResult && dbResult.length > 0) {

                        console.log(dbResult[0].p_out_player_id);

                        if (dbResult[0].p_out_player_id) {

                            let tempRes = dbResult[0].p_out_player_id.split('|')
                            let _player_id = tempRes[0]
                            let _player_app_id = tempRes[1]

                            let tokenParam = {
                                playerId: _player_id,
                                appId: _app_id
                            }

                            nz_access_token = jwtToken.generateToken(tokenParam);

                            let updateTokenQuery = `update tbl_player_app set nz_access_token = '${nz_access_token}' where  player_app_id = ${_player_app_id} returning *`;

                            let updateResult = await pgConnection.executeQuery('loyalty', updateTokenQuery)

                            if (updateResult && updateResult.length > 0) {

                                response.accessToken = nz_access_token
                                response.playerId = _player_id

                                services.sendResponse.sendWithCode(req, res, response, customRegMsgType, "USER_REGISTERED_SUCCESS");
                            }

                        } else {
                            services.sendResponse.sendWithCode(req, res, response, customRegMsgType, "USER_ALREADY_REGISTERD");
                        }

                    }
                }

                catch (dbError) {
                    console.log(dbError);
                    services.sendResponse.sendWithCode(req, res, response, "COMMON_MESSAGE", "DB_ERROR");
                }

            } else {
                services.sendResponse.sendWithCode(req, res, 'Invalid App Key', customMsgTypeCM, "VALIDATION_FAILED");

            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    getDetails: async function (req, res) {
        let _app_id;
        let customResult;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["app-key"]);

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

    getEvents: async function (req, res) {
        let _app_id;

        try {
            _app_id = await services.commonServices.getAppId(req.headers["app-key"]);

        } catch (error) {
            _app_id = null;
        }

        if (_app_id) {

            let _query = {
                text: "SELECT * FROM fn_get_events($1)",
                values: [_app_id]
            }

            try {
                let dbResult = await pgConnection.executeQuery('loyalty', _query)

                if (dbResult && dbResult.length > 0) {

                    services.sendResponse.sendWithCode(req, res, dbResult[0], customMsgType, "GET_SUCCESS");
                } else {
                    services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
                }
            }
            catch (error) {
                services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
            }
        } else {
            services.sendResponse.sendWithCode(req, res, "Invalid App Key", customMsgTypeCM, "VALIDATION_FAILED");
        }


    },

}