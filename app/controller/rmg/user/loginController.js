const md5 = require('md5');
const logger = require('tracer').colorConsole();

const jwtToken = require('../auth/jwtToken');
const pgConnection = require('../model/pgConnection');
const services = require('../service/service');
const validate = require('../ultility/registerValidation');
const {toCamelCaseKeys} = require('../ultility/utility');
const playerController = require('../controller/playerController');
const playerAgencyController = require('../controller/player/playerAgencyController');
const walletBalance = require('../wallet/walletBalance');
const walletController = require('../wallet/walletController');
const otpController = require('../controller/otpController');
const tokenController = require('../player/tokenController');
const bonusController = require('./bonusController');
const {randomNumber, generateOtpMessage, firstTimeUserMessage} = require('../ultility/utility');
const {publishMessage} = require('../clients/smsClients');
const config = require('config');

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

                services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_REGISTERED_SUCCESS");
              }

            } else {
              services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_ALREADY_REGISTERD");
            }

          }
        } catch (dbError) {
          console.log(dbError);
          services.sendResponse.sendWithCode(req, res, response, "COMMON_MESSAGE", "DB_ERROR");
        }

      } else {
        services.sendResponse.sendWithCode(req, res, 'Invalid App Key', customMsgTypeCM, "VALIDATION_FAILED");

      }
    } else {
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
                    dbResult[0].userid, "USER_VERIFICATION", {
                      userid: dbResult[0].userid,
                      emailid: dbResult[0].emailid,
                      firstname: dbResult[0].firstname,
                      lastname: dbResult[0].lastname,
                      mobilenumber: dbResult[0].mobilenumber
                    },
                    null);
                } else {
                  services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
                }
              } else {
                services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
              }
            } else {
              services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_VERIFICATION_CODE");
            }
          } else if (dbResult[0].status == 'DE-ACTIVE')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEACTIVE");
          else if (dbResult[0].status == 'VERIFIED')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_ALREADY_VERIFIED");
          else if (dbResult[0].status == 'REJECTED')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_REJECTED");
          else if (dbResult[0].status == 'ACTIVE')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_ALREADY_ACTIVE");
          else
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEFAULT");
        } else {
          services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
        }
      } catch (dbError) {
        services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
      }
    } else {
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
          } else if (dbResult[0].status == 'DE-ACTIVE')
            services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_DEACTIVE");
          else if (dbResult[0].status == 'PENDING')
            services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_PENDING");
          else if (dbResult[0].status == 'VERIFIED')
            services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_VERIFIED");
          else if (dbResult[0].status == 'REJECTED')
            services.sendResponse.sendWithCode(req, res, response, customMsgType, "USER_REJECTED");
          else
            services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_FAILED");
        } else {
          services.sendResponse.sendWithCode(req, res, response, customMsgType, "LOGIN_FAILED");
        }
      } catch (dbError) {
        services.sendResponse.sendWithCode(req, res, response, "COMMON_MESSAGE", "DB_ERROR");
      }
    } else {
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
                  updateResult[0].userid, "FORGOT_PASSWORD", {
                    userid: updateResult[0].userid,
                    emailid: updateResult[0].emailid,
                    firstname: updateResult[0].firstname,
                    lastname: updateResult[0].lastname,
                    resetpwdcode: updateResult[0].resetpwdcode,
                    mobilenumber: dbResult[0].mobilenumber
                  },
                  null);
              } else {
                services.sendResponse.sendWithCode(req, res, null, customMsgType, "PASSWORD_LINK_FAILED");
              }
            } else {
              services.sendResponse.sendWithCode(req, res, null, customMsgType, "PASSWORD_LINK_FAILED");
            }
          } else {

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
        } else {
          services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
        }
      } catch (dbError) {

        console.log('dbError - ', dbError);
        services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
      }
    } else {
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
                } else {
                  services.sendResponse.sendWithCode(req, res, null, customMsgType, "PWD_RESET_FAILED");
                }
              } else {
                services.sendResponse.sendWithCode(req, res, null, customMsgType, "EMAIL_VERIFIED_FAILED");
              }
            } else {
              services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_CONFIRMATION_CODE");
            }
          } else if (dbResult[0].status == 'DE-ACTIVE')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_DEACTIVE");
          else if (dbResult[0].status == 'REJECTED')
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "USER_REJECTED");
          else
            services.sendResponse.sendWithCode(req, res, null, customMsgType, "ACCOUNT_NOT_ACTIVE");
        } else {
          services.sendResponse.sendWithCode(req, res, null, customMsgType, "INVALID_EMAIL");
        }
      } catch (dbError) {
        services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "DB_ERROR");
      }
    } else {
      services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
    }
  }
}

module.exports.otpLogin = async function (req, res) {
  try {
    // req.headers["app-key"]
    // logger.debug('res locals', res.locals);
    const {app} = res.locals;
    let appSecret = req.headers['x-nazara-app-secret-key'];
    let checksum = req.headers['checksum'];
    let {
      full_name,
      first_name,
      last_name,
      photo,
      mobile, 
      email_id,
      password, 
      facebook_id,
      google_id,
      truecaller_id,
      firebase_id,
      channel,
      nzbonus,
      app_hash,
      device_id,
      source
    } = req.query;

    let agency = {
      agencyName: req.query.agency_name,
      agencyPara: req.query.agency_para,
      agencyPubId: req.query.agency_pubid,
      agencyClickId: req.query.click_id
    };

    let otpPin = '';
    // check if mobile number is pass or not.
    // if not then throw an error.
    if (mobile === undefined || mobile === '') {
      throw ({"statusCode": 400, "message": "please provide mobile number"});
    }
    let invalidNumber = mobile.startsWith('910');
    if (mobile !== '', !invalidNumber) {
      // validate all required fields.
      let validateFields = validate.registerValidate(mobile, email_id, first_name, last_name, facebook_id, google_id);
      if (validateFields.flag) {
        //TODO: checksum validation.
        // check if device id is block
        let isDeviceIdBlocked = false;
        logger.info('device id pass in query: ', device_id);
        if (device_id != '' && device_id != undefined) {
          logger.info('checking if device is block:', device_id);
          // logger.info('if device block or not:', playerController.checkBlockDeviceById());
          let blockDevices = await playerController.checkBlockDeviceById(device_id);
          if (blockDevices !== 0) {
            isDeviceIdBlocked = true;
            throw ({statusCode: 420, message: 'fraud Device'});
          }
        }
        if (!isDeviceIdBlocked) {
          // checking if player exists in db.
          let playerResponse = await playerController.playerExists(mobile);
          logger.info('response', playerResponse);
          // if error
          if (playerResponse === undefined) {
            // create player record in db
            playerResponse = await playerController.createPlayer(app.app_id, mobile, email_id, first_name, last_name, password, photo, facebook_id, google_id, truecaller_id, source, full_name, 'ACTIVE');
            logger.debug('created player: ', playerResponse);
            // create device record in db
            if (device_id !== '' && device_id != undefined) {
              playerController.createDevice(playerResponse.player_id, app.app_id, device_id, firebase_id);
            }
            // create agency record in db
            if (agency.agencyName !== '' && agency.agencyName != undefined) {
              playerAgencyController.createPlayerAgency(playerResponse.player_id, agency.agencyName, agency.agencyPara, agency.agencyPubId, agency.agencyClickId);
            }

            // add initializing wallet balance
            let initialBalance = await walletBalance.initBalance(playerResponse.player_id);
            logger.debug('inital balance', initialBalance);

            //TODO: need to confirm if the registration coin balance is required.
            // // add registration coin balance
            // if (config[config.partner].regiestrationCoin) {
            //   let bonusTranx = await bonusController.bonusTransactionInit(app.app_id, playerResponse.player_id, 'Register Bonus', 'REGISTER', '0', 'CREDIT', config[config.partner].regiestrationCoin, 'FIRST TIME REGISTRATION', '', '');
            //   logger.debug('bonus transaction:', bonusTranx);
            // }

            // // add registration reward balance
            // if (config[config.partner].registrationReward) {
            //   let orderId = `BP-Cr-${Date.now()}`;
            //   let reward = config[config.partner].registrationReward;
            //   let walletTranx = await walletBalance.addWalletTransaction(app.app_id, playerResponse.player_id, orderId, mobile, 0, 'INR', '', '', '', 'SUCCESS', orderId, '200', '', 'CREDIT', '', '', '', orderId, 'SUCCESS', 'REGISTRATION', '', 'REGISTRATION REWARD BONUS', reward, channel);
            //   logger.debug('wallet transaction: ', walletTranx);
            //   let creditReward = await walletBalance.creditRewardBalance(playerResponse.player_id, walletTranx.wallet_txn_id, 'CREDIT', 0, reward);
            //   logger.debug('credited reward for player in wallet balance', creditReward);
            // }

            // this might be common between both conditions.
            // check if opt send previouly
            let previousOtp =  await otpController.checkPreviouOtp(playerResponse.player_id);
            logger.debug('previousOpt response: ', previousOtp);
            if (!previousOtp && previousOtp != undefined) {
              otpPin = previousOtp.otp_pin;
            } else {
              // generate new opt for player
              otpPin = randomNumber(4);
            }
            logger.info('otp generated: ', otpPin);
            // get opt message 
            let optMessage = generateOtpMessage(otpPin);
            if (app_hash !== '' && app_hash != undefined) {
              optMessage = `<#> ${optMessage} ${app_hash}`;
            }
            // create sms record into db.
            let smsCreated = await otpController.createSms(app.app_id, playerResponse.player_id, mobile, optMessage);
            logger.debug('created sms: ', smsCreated);
            // create otp recored into db.
            let otpCreated = await otpController.createOtp(playerResponse.player_id, smsCreated.sms_id, otpPin, playerResponse.phone_number_verified);
            if (otpCreated && otpCreated != undefined) {
              // message, phone, txnId, priority, partner
              let publish = await publishMessage(optMessage, mobile, smsCreated.sms_id, 2, config.partner);
              logger.debug('send/publish sms to server :', publish);
              // update sms log in db
              let updatedSms = await otpController.updateSms(smsCreated.sms_id, publish);
              otpCreated.otp_pin = '';
              return res.status(200).send({
                success: 1,
                statusCode: 200,
                message: 'Success',
                data: otpCreated
              })
            } else {
              throw({statusCode: 401, message: 'Otp not generated.'});
            }
          } else if (playerResponse) {
            //TODO: need to make a function for common process in both condition.
            // if player exist then, this condition or section get executes.
            // generate opt and other flow
            // create device record in db
            if (device_id !== '' && device_id != undefined) {
              playerController.createDevice(playerResponse.player_id, app.app_id, device_id, firebase_id);
            }

            // create agency record in db
            if (agency.agencyName !== '' && agency.agencyName != undefined) {
              playerAgencyController.createPlayerAgency(playerResponse.player_id, agency.agencyName, agency.agencyPara, agency.agencyPubId, agency.agencyClickId);
            }

            // check if opt send previouly
            let previousOtp =  await otpController.checkPreviouOtp(playerResponse.player_id);
            logger.debug('previousOpt response: ', previousOtp);
            if (!previousOtp && previousOtp != undefined) {
              otpPin = previousOtp.otp_pin;
            } else {
              // generate new opt for player
              otpPin = randomNumber(4);
            }
            logger.info('otp generated: ', otpPin);
            // get opt message 
            let optMessage = generateOtpMessage(otpPin);
            if (app_hash !== '' && app_hash != undefined) {
              optMessage = `<#> ${optMessage} ${app_hash}`;
            }
            // create sms record into db.
            let smsCreated = await otpController.createSms(app.app_id, playerResponse.player_id, mobile, optMessage);
            logger.debug('created sms: ', smsCreated);
            // create otp recored into db.
            let otpCreated = await otpController.createOtp(playerResponse.player_id, smsCreated.sms_id, otpPin, playerResponse.phone_number_verified);
            if (otpCreated && otpCreated != undefined) {
              // message, phone, txnId, priority, partner
              let publish = await publishMessage(optMessage, mobile, smsCreated.sms_id, 2, config.partner);
              logger.debug('send/publish sms to server :', publish);
              // update sms log in db
              let updatedSms = await otpController.updateSms(smsCreated.sms_id, publish);
              otpCreated.otp_pin = '';
              let camelCaseResponse = toCamelCaseKeys(otpCreated);
              return res.status(200).send({
                success: 1,
                statusCode: 200,
                message: 'Success',
                data: camelCaseResponse
                // data: {
                //   otpId: otpCreated.otp_id,
                //   playerId: otpCreated.player_id,
                //   smsId: otpCreated.sms_id,
                //   otpPin: otpCreated.otp_pin,
                //   otpVerified: otpCreated.otp_verified
                // }
              })
            } else {
              throw({statusCode: 401, message: 'Otp not generated.'});
            }

          }
        } else {
          throw({
            statusCode: 400,
            message: `Device is block`
          });
        }
        // }
      } else {
        throw ({
          statusCode: 400,
          message: `Invalid credentials or ${validateFields.message}`
        });
      }
    } else {
      throw new Error('Invalid number');
    }

  } catch (err) {
    logger.error(err);
    // let error = JSON.parse(err.message);
    // logger.error(err.statusCode);
    // logger.error(err.message);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    res.status(err.statusCode).send({
      success: false,
      message: err.message,
      data: ''
    });
  }
}

module.exports.otpLoginVerify = async function(app, appSecret, checksum, otpId, otpPin, mobile, isNewUser, channel) {
  try {
    logger.debug('verify otp for login', otpId, otpPin);
    //TODO: checksum validation.

    // if (checksumValidate) {
      // otp log creation in db.
      otpController.otpRetryLog(otpId, otpPin);
      logger.debug('opt log created success');
      // verify otp
      let otpVerify = await otpController.verifyOtp(otpId, otpPin);
      logger.debug('otp verify from db: ', otpVerify);
      if (otpVerify.verify) {
        logger.debug('otp get verify successfully.');
        let player = await playerController.getPlayerFullDetailByPhone(otpVerify.player_id, mobile);
        if (!player.phone_number_verified || player.phone_number_verified == null) {
          isNewUser = true;
        } else {
          isNewUser = false;
        }
        logger.info('if is user new: ', isNewUser);
        logger.info('if is user new: ', typeof isNewUser);
        let verifyMobile = await playerController.verifyPlayerMobile(otpVerify.player_id);
        logger.info('verify mobile', verifyMobile);
        //TODO: need to verify this one
        player.phone_number_verified = verifyMobile.phone_number_verified;
        // update otp 
        let updateOtp = await otpController.updateVerifyOtp(otpId);
        logger.info('update otp to verify:', updateOtp);
        
        // get player and generate token.
        let generatedToken = await tokenController.playerGenerateToken(app.app_id, app.app_name, player.player_id, player.device_id);
        // logger.info('access token generated for a player:', generatedToken);
        player.token = generatedToken.token;

        // if new user then, send sms and fire pixel.
        if (isNewUser) {
          logger.debug('new user section steps');
          let message = firstTimeUserMessage();
          let createdSms = await otpController.createSms(app.app_id, player.player_id, mobile, message);
          if (createdSms != undefined) {
            let publish = await publishMessage(message, mobile, createdSms.sms_id, 2, config.partner);
          }
          if (config[config.partner].RegistrationFirePixel === 'YES') {
            // fire pixel
            logger.info('fire pixel condition get satisfy:');
            playerController.firePixel(player.player_id, 'REGISTRATION_VERIFIED', 0);
          }
          
          //TODO: need to confirm if the registration coin balance is required.
          // add registration coin balance
          if (config[config.partner].regiestrationCoin) {
            let bonusTranx = await bonusController.bonusTransactionInit(app.app_id, player.player_id, 'Register Bonus', 'REGISTER', '0', 'CREDIT', config[config.partner].regiestrationCoin, 'FIRST TIME REGISTRATION', '', '');
            logger.debug('bonus transaction:', bonusTranx);
          }

          // add registration reward balance
          if (config[config.partner].registrationReward) {
            let orderId = `BP-Cr-${Date.now()}`;
            let reward = config[config.partner].registrationReward;
            let walletTranx = await walletBalance.addWalletTransaction(app.app_id, player.player_id, orderId, mobile, 0, 'INR', '', '', '', 'SUCCESS', orderId, '200', '', 'CREDIT', '', '', '', orderId, 'SUCCESS', 'REGISTRATION', '', 'REGISTRATION REWARD BONUS', reward, channel);
            logger.debug('wallet transaction: ', walletTranx);
            let creditReward = await walletBalance.creditRewardBalance(player.player_id, walletTranx.wallet_txn_id, 'CREDIT', 0, reward);
            logger.debug('credited reward for player in wallet balance', creditReward);
          }
        
        }
        player.mobile = player.phone_number;
        delete player.phone_number;
        let camelCaseResponse = toCamelCaseKeys(player);
        return camelCaseResponse;
      } else if (!otpVerify.verify) {
        throw({
          customMsgType: 'LOGIN_MESSAGE',
          customMsgCode :'INVALID_OPT_PIN' ,
          statusCode: 401, 
          message: `Invalid Opt pin entered.`
        });
      }
    // } else {

    // }
  } catch (err) {
    throw new Error(err);
  }
};
