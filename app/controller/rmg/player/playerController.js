const logger = require('tracer').colorConsole();
// const pgConnect = require('../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');
// const playerAgencyController = require('./player/playerAgencyController');
const playerAgencyController = require('./playerAgencyController');

// module.exports.checkBlockDeviceById = checkBlockDeviceById = async function(deviceId) {
checkBlockDeviceById = async function(deviceId) {
  try {
    let query = {
      text: `select device_id from tbl_player_block_device where device_id = $1`,
      values: [deviceId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('if the device is block', response.length);
    return response.length;
  } catch (err) {
    logger.error(err.message);
    throw new Error(err.message);
  }
};

createPlayer = async function(app_id, mobile, email_id, first_name, last_name, password, photo, facebook_id, google_id, truecaller_id, source, full_name, status) {
  try {
    // logger.info('log arguments:', arguments);
    let isGuest = mobile || email_id || facebook_id ? false : true;
    let query = {
      text: `insert into tbl_player (is_guest, app_id, phone_number, email_id, facebook_id, google_id, first_name, last_name, full_name, truecaller_id, status) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      values: [
        isGuest,
        app_id,
        mobile,
        email_id,
        facebook_id,
        google_id,
        first_name,
        last_name,
        full_name,
        truecaller_id,
        status
      ]
    };
    let playerCreated = await pgConnect.executeQuery('loyalty',query);
    logger.debug('player created: ', playerCreated[0]);
    return playerCreated[0];
  } catch (err) {
    throw new Error(err.message);
  }
};

playerExists = async function(mobile, email) {
  try {
    logger.debug('checking if player the exists in db');
    let query = {
      text: `select * from tbl_player where `,
      values: []
    };
    if (mobile !== '' || mobile !== undefined) {
      query.text += `phone_number = $1 limit 1`;
      query.values.push(mobile);
    } else if (email !== '' || email !== undefined) {
      query.text += `email_id = $1 limit 1`;
      query.values.push(email);
    }

    let player = await pgConnect.executeQuery('loyalty',query);
    logger.trace('player found:', player);
    query.values = [];
    return player[0];
  } catch (err) {
    throw new Error(err);
  }
};

createDevice = async function(player_id, app_id, device_id, fcmToken) {
  try {
    let query = {
      text: `insert into tbl_player_device (player_id, app_id, device_id, fcm_token, created_at) values ($1, $2, $3, $4, now()) ON CONFLICT DO NOTHING RETURNING device_id;`,
      values: [player_id, app_id, device_id, fcmToken]
    };
    let deviceCreated = await pgConnect.executeQuery('loyalty',query);
    logger.debug('device created: ', deviceCreated[0])
    return deviceCreated[0];
  } catch(err) {
    throw new Error(err);
  }
};

const getPlayerById = async function(playerId) {
  try {
    let query = {
      text: `select * from tbl_player_master where player_id = $1 and status IN ('ACTIVE','STKUSER') limit 1;`,
      values: [playerId]
    };
    let player = await pgConnect.executeQuery('loyalty',query);
    logger.debug('player get by id: ', player[0]);
    return player[0];
  } catch(err) {
    throw new Error(err);
  }
};

const getPlayerDetailsById = async function(playerId) {
  try {
    let query = {
      text: `SELECT p.player_id, p.player_id as player_id_str, d.device_id, is_guest, full_name, first_name, last_name, email_id, email_id_token, email_id_verified, phone_number, phone_number_verified, photo, facebook_id, google_id, status, p.created_at, p.updated_at, source, airpay_token, airpay_consumer_id, dob, city, state, gender, language
      FROM tbl_player p
      left join tbl_player_device d on d.player_id = p.player_id
      where p.player_id = $1 and status IN ('ACTIVE','STKUSER')  limit 1;`,
      values: [playerId]
    };
    let playerDetails = await pgConnect.executeQuery('loyalty',query);
    logger.info('player details get by id: ', playerDetails[0]);
    return playerDetails[0];
  } catch(err) {
    throw new Error(err);
  }
};

getPlayerFullDetailByPhone = async function(playerId, mobile) {
  try {
    let query = {
      text: `select p.player_id, p.player_id as player_id_str, d.device_id, 
      d.app_id, is_guest, full_name, first_name, last_name, password, email_id, email_id_token, 
      email_id_verified, phone_number, phone_number_verified, photo, facebook_id, google_id, 
      status, source, airpay_token, airpay_consumer_id, dob, city, state, country, gender, 
      language, p.created_at from tbl_player p
      left join tbl_player_device d on d.player_id = p.player_id 
      where status IN ('ACTIVE','STKUSER', 'BLOCK') and phone_number = $1`,
      values: [mobile]
    };
    let player = await pgConnect.executeQuery('loyalty',query);
    logger.debug('player with devices id and other fields:', player[0]);
    return player[0];
  } catch(err) {
    throw new Error(err);
  }
};

const getPlayerWalletBalance = async function(playerId) {
  try {
    let query = {
      text: `SELECT b.player_id, 
      case when b.bonus is null then 0 else b.bonus end as bonus,
      case when w.winning_balance is null then 0 else w.winning_balance end as winning_balance,
      case when w.deposit_balance is null then 0 else w.deposit_balance end as deposit_balance,
      case when w.reward_balance is null then 0 else w.reward_balance end as reward_balance
      from tbl_wallet_balance w
      left join tbl_bonus b on w.player_id = b.player_id
      where w.player_id = $1 limit 1;`,
      values: [playerId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('player wallet balance details:', response[0]);
    return response[0];
  } catch(err) {
    throw new Error(err);
  }
};

verifyPlayerMobile = async function(playerId) {
  try {
    let query = {
      text: `UPDATE tbl_player
      SET phone_number_verified = 'true', updated_at = NOW() where player_id = $1 RETURNING phone_number_verified;`,
      values: [playerId]
    };
    let verifyMobile = await pgConnect.executeQuery('loyalty',query);
    logger.debug('mobile verified successfully in db:', verifyMobile[0]);
    return verifyMobile[0];
  } catch(err) {
    throw(err);
  }
};

const firePixel = async (playerId, event, amount) => {
  try {
    let source = '', url = '';
    // get agency details for a player.
    let agencyDetails = await playerAgencyController.getAgencyDetails(playerId);
    if (agencyDetails.source !== '' && agencyDetails.source != undefined) {
      source  = agencyDetails.source.toLowerCase();
      if (agencyDetails.click_id) {
        agencyDetails.click_id = `BigPesa_${Date.now()}`;
      }
      // get pixel master details.
      let pixelMaster = await playerAgencyController.getPixelMaster(source, event);
      url = pixelMaster.pixel_url;
      if (url != '' && url != null) {
        // add pixel fire into db.
        url = url.replace('[CLICK_ID]', agencyDetails.click_id);
        let pixelFire = await playerAgencyController.addPixelLog(playerId, source, agencyDetails.click_id, event, url, '', 'PENDING');
        return pixelFire;
      }
    }

  } catch(err) {
    throw(err);
  }
};

const updatePlayer = async (playerId, deviceId, appId, appName, fullName, firstName, lastName, emailId, number, photo, facebookId, googleId, accessToken, truecallerId, dob, city, state, country, gender, language) => {
  try {
    let textString = `UPDATE tbl_player SET `;
    if (emailId && emailId != '') {
      textString += `email_id = '${emailId}', `;
    }
    if (number && number != '') {
      textString += `number = '${number}', `
    }
    if (facebookId && facebookId != '') {
      textString += `facebook_id = '${facebookId}', `;
    }
    if (googleId && googleId != '') {
      textString += `google_id = '${googleId}', `;
    }
    if (truecallerId && truecallerId != '') {
      textString += `truecaller_id = '${truecallerId}', `
    };
    if (fullName && fullName != '') {
      textString += `full_name = '${fullName}', `;
    }
    if (firstName && firstName != '') {
      textString += `first_name = '${firstName}', `;
    }
    if (lastName && lastName != '') {
      textString += `last_name = '${lastName}', `;
    }
    if (dob && dob != '') {
      textString += `dob = '${new Date(dob)}', `;
    }
    if (city && city != '') {
      textString += `city = '${city}', `;
    }
    if (state && state != '') {
      textString += `state = '${state}', `;
    }
    if (country && country != '') {
      textString += `country = '${country}', `;
    }
    if (gender && gender != '') {
      textString += `gender = '${gender}', `;
    }
    if (language && language != '') {
      textString += `language = '${language}', `;
    }
    if (photo && photo != '') {
      textString += `photo = '${photo}', `;
    }
    let query = {
      text: `${textString} updated_at = NOW() where player_id = $1 RETURNING *;`,
      values: [playerId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('updated player details successfully: ', response[0]);
    return response[0];
  } catch(err) {
    logger.err('error while player update: ', err);
    throw(err);
  }
};

module.exports = {
  checkBlockDeviceById,
  createPlayer,
  playerExists,
  createDevice,
  getPlayerById,
  getPlayerFullDetailByPhone,
  verifyPlayerMobile,
  firePixel,
  getPlayerWalletBalance,
  getPlayerDetailsById,
  updatePlayer
};
