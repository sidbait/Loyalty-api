const logger = require('tracer').colorConsole();
const pgConnect = require('../model/pgConnections');

async function checkPreviouOtp(playerId) {
  try {
    let query = {
      text: `select * from tbl_otp where player_id = $1 and otp_verified = false and created_at > NOW() - interval '10 minutes' ;`,
      values: [playerId]
    };
    let previousOtp = await pgConnect.executeQuery(query);
    logger.info('previous otp if send: ', previousOtp);
    return previousOtp[previousOtp.length - 1];
  } catch(err) {
    throw new Error(err);
  }
};

async function createSms(appId, playerId, number, message) {
  try {
    if (appId === '' || appId == undefined) {
      appId = 0;
      playerId = 0;
    }
    let query = {
      text: `insert into tbl_sms_log(app_id, player_id, phone_number, sms_message, gateway_url, gateway_request, gateway_response, status, created_by, created_at, updated_by, updated_at) values ($1, $2, $3, $4, 'amazonsns', '', '', 'ACTIVE', 'admin', now(), 'admin', now()) RETURNING sms_id;`,
      values: [appId, playerId, number, message]
    };
    let createdSms = await pgConnect.executeQuery(query);
    logger.info('sms created: ', createdSms[0]);
    return createdSms[0];
  } catch (err) {
    throw new Error(err);
  }
};

async function createOtp(playerId, smsId, otpPin, isNewUser) {
  try {
    let query = {
      text: `insert into tbl_otp(player_id, sms_id, otp_pin, otp_verified, created_by, created_at, updated_by, updated_at) values($1, $2, $3, false, 'admin', now(), 'admin', now()) RETURNING otp_id, player_id, sms_id, otp_pin, otp_verified;`,
      values: [playerId, smsId, otpPin]
    };
    let createdOtp = await pgConnect.executeQuery(query);
    logger.info('opt created: ', createdOtp[0]);
    return createdOtp[0];
  } catch(err) {
    throw new Error(err);
  };
};

async function updateSms(smsId, gatewayResponse) {
  try {
    let query = {
      text: `update tbl_sms_log set gateway_response = $2, updated_at = NOW() where sms_id = $1;`,
      values: [smsId, gatewayResponse]
    };
    let updateOtp = await pgConnect.executeQuery(query);
    logger.info('otp updated: ', updateOtp);
    return updateOtp;
  } catch(err) {
    throw new Error(err);
  }
};

async function otpRetryLog(otpId, otpPin) {
  try {
    let query = {
      text: `INSERT INTO tbl_otp_retry(otp_id, entered_otp_pin,created_at) VALUES ($1, $2, now());`,
      values: [otpId, otpPin]
    };
    let otpRetry = await pgConnect.executeQuery(query);

    logger.info('otp retry log in db: ', otpRetry[0]);
    return otpRetry[0];
  } catch(err) {
    throw new Error(err);
  }
};

async function verifyOtp(optId, optPin) {
  try {
    let query = {
      text: `select * from tbl_otp where otp_id = $1 and otp_pin = $2 limit 1;`,
      values: [optId, optPin]
    };
    let otpVerify = await pgConnect.executeQuery(query);
    logger.info('opt verify from db: ', otpVerify[0]);
    if (otpVerify.length > 0) {
      otpVerify[0].verify = true;
      return otpVerify[0];
    } else {
      otpVerify[0].verify = false;
      return otpVerify[0];
    }
  } catch(err) {
    throw new Error(err);
  }
};

async function updateVerifyOtp(otpId) {
  try {
    let query = {
      text: `update tbl_otp set 
      otp_verified = 'true', updated_at = NOW()
      where otp_id = $1 RETURNING otp_id, player_id, sms_id, otp_pin, otp_verified;`,
      values: [otpId]
    };
    let updateOtp = await pgConnect.executeQuery(query);
    logger.info('otp updated to verified:', updateOtp[0]);
    return updateOtp[0];
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  checkPreviouOtp,
  createSms,
  createOtp,
  updateSms,
  otpRetryLog,
  verifyOtp,
  updateVerifyOtp
};
