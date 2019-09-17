const jwt = require('jsonwebtoken');
const logger = require('tracer').colorConsole();
const jwtToken = require('../../auth/jwtToken');
// const pgConnect = require('../../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');

async function playerGenerateToken(appId, appName, playerId, deviceId) {
  try {
    logger.trace('playerId:', playerId);
    // generate access token for a player.
    let token = jwtToken.generateToken({appId, appName, playerId, deviceId});
    // encrypt access token generated.
    let encryptToken = jwtToken.encryptAccessToken(token);
    logger.debug('encrypted token: ', encryptToken);
    let query = {
      text: `INSERT INTO tbl_token (player_id, token, expire_at, created_at)
      VALUES ($1, $2,now() + interval '3 year',now()) ON CONFLICT (player_id)
      DO UPDATE SET token = excluded.token, expire_at = excluded.expire_at RETURNING token;`,
      values: [playerId, encryptToken]
    };
    let response = await pgConnect.executeQuery(query);
    logger.warn('token response', response);
    return response[0];
  } catch(err) {
    logger.error(err);
    throw new Error(err);
  }
};

module.exports = {
  playerGenerateToken
};
