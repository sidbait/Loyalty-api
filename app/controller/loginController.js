const md5 = require('md5');

const jwtToken = require('../auth/jwtToken');
const pgConnection = require('../model/pgConnection');
const services = require('../service/service');

const customMsgType = "LOGIN_MESSAGE";

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
                _app_id = await services.commonServices.getAppId(req.headers["x-loyalty-app-key"]);

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

                                services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_REGISTERED_SUCCESS");
                            }

                        } else {
                            services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_ALREADY_REGISTERD");
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

    register1: async function (req, res) {

        let rules = {
            "username": 'required',
            "emailId": 'required',
            "fullname": 'required',
            "password": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _username = req.body.username ? req.body.username : null;
            let _email = req.body.emailId ? req.body.emailId : null;
            let _fullname = req.body.fullname ? req.body.fullname : null;
            let _password = req.body.password ? req.body.password : null;
            let _created_by = req.body.userid ? req.body.userid : null;
            let _updated_by = req.body.userid ? req.body.userid : null;
            let _password_hash = md5(_password)
            let _status = 'ACTIVE';
            let _role_id = '420575820530548737'
            let _query = {
                text: "INSERT INTO tbl_user(username,email,fullname,password_hash,status,role_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now()) RETURNING *",
                values: [
                    _username, _email, _fullname, _password_hash, _status, _role_id, _created_by
                ]
            }

            let checkInDB = `select user_id from tbl_user where email = '${_email}' or username = '${_username}'`

            let response = {
                accessToken: null,
                userDetails: null
            }

            try {

                let checkInDBResult = await pgConnection.executeQuery('rmg_dev_db', checkInDB)
                // console.log(checkInDBResult);

                if (checkInDBResult && checkInDBResult.length > 0) {
                    services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_ALREADY_REGISTERD");
                }
                else {
                    let dbResult = await pgConnection.executeQuery('rmg_dev_db', _query)
                    // console.log(dbResult);

                    if (dbResult && dbResult.length > 0) {

                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_REGISTERED_SUCCESS");
                    }
                }
            }
            catch (dbError) {
                console.log(dbError);
                services.sendResponse.sendWithCode(req, res, response, "COMMON_MESSAGE", "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    verifyEmail: async function (req, res) {

        let rules = {
            "userId": 'required',
            "emailId": 'required',
            "verificationCode": 'required',
        };

        let custom_message = {
            "required.userId": "User Id is mandatory!",
            "required.emailId": "Email Id is mandatory!",
            "required.verificationCode": "Verification code is mandatory!",
        }

        let validation = new services.validator(req.body, rules, custom_message);

        if (validation.passes()) {

            let userId = req.body.userId ? req.body.userId : null;
            let emailId = req.body.emailId ? req.body.emailId : '';
            let verificationCode = req.body.verificationCode ? req.body.verificationCode : '';

            let pgQuery = {
                text: "select * from tbl_user " +
                    "where userid = $1 and lower(emailid) = $2 limit 1",
                values: [
                    userId,
                    emailId.toLowerCase()
                ],
            }

            try {

                let dbResult = await pgConnection.executeQuery("cms", pgQuery)

                if (dbResult && dbResult.length > 0) {

                    if (dbResult[0].status == 'PENDING') {

                        if (verificationCode == dbResult[0].verificationcode) {

                            pgQuery = {
                                text: "update tbl_user set isverified = true, verifieddate = now(), status = 'VERIFIED' " +
                                    "where userid = $1 and lower(emailid) = $2 and verificationcode = $3 " +
                                    "returning userid",
                                values: [
                                    userId,
                                    emailId.toLowerCase(),
                                    verificationCode
                                ],
                            }

                            let updateResult = await pgConnection.executeQuery("cms", pgQuery)

                            if (updateResult && updateResult.length > 0) {

                                if (updateResult[0].userid > 0) {

                                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_SUCCESS");

                                    services.sendMail.sendToQueue(
                                        dbResult[0].userid, "USER_VERIFICATION",
                                        {
                                            userid: dbResult[0].userid,
                                            emailid: dbResult[0].emailid,
                                            firstname: dbResult[0].firstname,
                                            lastname: dbResult[0].lastname,
                                            mobilenumber: dbResult[0].mobilenumber
                                        },
                                        null);
                                }
                                else {
                                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
                                }
                            } else {
                                services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
                            }
                        }
                        else {
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_VERIFICATION_CODE");
                        }
                    }
                    else if (dbResult[0].status == 'DE-ACTIVE')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEACTIVE");
                    else if (dbResult[0].status == 'VERIFIED')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_ALREADY_VERIFIED");
                    else if (dbResult[0].status == 'REJECTED')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_REJECTED");
                    else if (dbResult[0].status == 'ACTIVE')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_ALREADY_ACTIVE");
                    else
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEFAULT");
                }
                else {
                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
                }
            }
            catch (dbError) {
                services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    validateLogin: async function (req, res) {

        let rules = {
            "emailId": 'required',
            "password": 'required'
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let emailId = req.body.emailId ? req.body.emailId : '';
            let password = req.body.password ? req.body.password : '';
            let _password_hash = md5(password)

            let pgQuery = {
                text: "select tbl_user.*, role_title from tbl_user " +
                    "left join tbl_role on tbl_role.role_id = tbl_user.role_id " +
                    "where lower(email) = $1 and password_hash = $2 limit 1",
                values: [
                    emailId.toLowerCase(),
                    _password_hash
                ],
            }

            let response = {
                accessToken: null,
                userDetails: null
            }
            // if (emailId == 'admin' && password == 'Vi6fFYz0') {

            //     response.accessToken = 'accessToken';
            //     response.userDetails = {
            //         userId: 1,
            //         status: 'ACTIVE',
            //     }
            //     services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_SUCCESS");
            // } else {
            //     services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_FAILED");
            // }
            try {

                let dbResult = await pgConnection.executeQuery('rmg_dev_db', pgQuery)

                if (dbResult && dbResult.length > 0) {

                    if (dbResult[0].status == 'ACTIVE') {

                        let userDetails = dbResult[0];
                        // console.log(userDetails);

                        let accessToken = jwtToken.generateToken(userDetails);

                        response.accessToken = accessToken;
                        response.userDetails = {
                            userId: userDetails.user_id,
                            userTypeId: userDetails.role_id,
                            userType: userDetails.role_title,
                            emailId: userDetails.email,
                            resetPwd: userDetails.password_reset_token,
                            status: userDetails.status,
                        }

                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_SUCCESS");
                    }
                    else if (dbResult[0].status == 'DE-ACTIVE')
                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_DEACTIVE");
                    else if (dbResult[0].status == 'PENDING')
                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_PENDING");
                    else if (dbResult[0].status == 'VERIFIED')
                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_VERIFIED");
                    else if (dbResult[0].status == 'REJECTED')
                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_REJECTED");
                    else
                        services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_FAILED");
                }
                else {
                    services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_FAILED");
                }
            }
            catch (dbError) {
                services.sendResponse.sendWithCode(req, res, response, "COMMON_MESSAGE", "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    forgotPassword: async function (req, res) {

        let rules = {
            "emailId": 'required',
        };

        let custom_message = {
            "required.emailId": "Email Id is mandatory!",
        }

        let validation = new services.validator(req.body, rules, custom_message);

        if (validation.passes()) {

            let emailId = req.body.emailId ? req.body.emailId : '';

            let pgQuery = {
                text: "select * from tbl_user where lower(emailid) = $1 limit 1",
                values: [
                    emailId.toLowerCase()
                ],
            }

            try {

                let dbResult = await pgConnection.executeQuery("cms", pgQuery)

                if (dbResult && dbResult.length > 0) {

                    if (dbResult[0].status == 'ACTIVE') {

                        pgQuery = {
                            text: "update tbl_user set resetpwdcode = (select fn_generate_random_string(6)) " +
                                "where lower(emailid) = $1" +
                                "returning *",
                            values: [
                                emailId.toLowerCase()
                            ],
                        }

                        let updateResult = await pgConnection.executeQuery("cms", pgQuery)

                        if (updateResult && updateResult.length > 0) {

                            if (updateResult[0].userid > 0) {

                                services.sendResponse.sendWithCode(req, res, null, customMsgType, "PASSWORD_LINK_SENT");

                                services.sendMail.sendToQueue(
                                    updateResult[0].userid, "FORGOT_PASSWORD",
                                    {
                                        userid: updateResult[0].userid,
                                        emailid: updateResult[0].emailid,
                                        firstname: updateResult[0].firstname,
                                        lastname: updateResult[0].lastname,
                                        resetpwdcode: updateResult[0].resetpwdcode,
                                        mobilenumber: dbResult[0].mobilenumber
                                    },
                                    null);
                            }
                            else {
                                services.sendResponse.sendWithCode(req, res, null, customMsgType, "PASSWORD_LINK_FAILED");
                            }
                        } else {
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "PASSWORD_LINK_FAILED");
                        }
                    }
                    else {

                        if (dbResult[0].status == 'DE-ACTIVE')
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEACTIVE");
                        else if (dbResult[0].status == 'PENDING')
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_PENDING");
                        else if (dbResult[0].status == 'VERIFIED')
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_VERIFIED");
                        else if (dbResult[0].status == 'REJECTED')
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_REJECTED");
                        else
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEFAULT");
                    }
                }
                else {
                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
                }
            }
            catch (dbError) {

                console.log('dbError - ', dbError);
                services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    resetPassword: async function (req, res) {

        let rules = {
            "userId": 'required',
            "emailId": 'required',
            "confirmationCode": 'required',
            "password": 'required'
        };

        let custom_message = {
            "required.userId": "User Id is mandatory!",
            "required.emailId": "Email Id is mandatory!",
            "required.confirmationCode": "Confirmation code is mandatory!",
            "required.password": "Password is mandatory!",
        }

        let validation = new services.validator(req.body, rules, custom_message);

        if (validation.passes()) {

            let userId = req.body.userId ? req.body.userId : null;
            let emailId = req.body.emailId ? req.body.emailId : '';
            let confirmationCode = req.body.confirmationCode ? req.body.confirmationCode : '';
            let password = req.body.password ? req.body.password : '';

            let pgQuery = {
                text: "select * from tbl_user " +
                    "where userid = $1 and lower(emailid) = $2 limit 1",
                values: [
                    userId,
                    emailId.toLowerCase()
                ],
            }

            try {

                let dbResult = await pgConnection.executeQuery("cms", pgQuery)

                if (dbResult && dbResult.length > 0) {

                    if (dbResult[0].status == 'ACTIVE') {

                        if (confirmationCode == dbResult[0].resetpwdcode) {

                            pgQuery = {
                                text: "update tbl_user set resetpwd = false, password = $1, resetpwdcode = null " +
                                    "where userid = $2 and lower(emailid) = $3 and resetpwdcode = $4 " +
                                    "returning userid",
                                values: [
                                    password,
                                    userId,
                                    emailId.toLowerCase(),
                                    confirmationCode
                                ],
                            }

                            let updateResult = await pgConnection.executeQuery("cms", pgQuery)

                            if (updateResult && updateResult.length > 0) {
                                if (updateResult[0].userid > 0) {
                                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "PWD_RESET_SUCCESS");
                                }
                                else {
                                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "PWD_RESET_FAILED");
                                }
                            } else {
                                services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
                            }
                        }
                        else {
                            services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_CONFIRMATION_CODE");
                        }
                    }
                    else if (dbResult[0].status == 'DE-ACTIVE')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEACTIVE");
                    else if (dbResult[0].status == 'REJECTED')
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_REJECTED");
                    else
                        services.sendResponse.sendWithCode(req, res, null, customMsgType, "ACCOUNT_NOT_ACTIVE");
                }
                else {
                    services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
                }
            }
            catch (dbError) {
                services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
            }
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    }
}