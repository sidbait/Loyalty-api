const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');
const md5 = require('md5');
const jwtToken = require('../../auth/jwtToken');
const pgConnect = require('../../model/pgConnections');
const logger = require('tracer').colorConsole();

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";
const customRegMsgType = "LOGIN_MESSAGE";

module.exports.getAppBySecretKey = async function(key) {
  try {
    logger.info('key: ', key);
    let query = {
      text: `select app_id, app_name, app_secret, app_code from tbl_app where app_secret = $1 and status = 'ACTIVE' limit 1;`,
      values: [key]
    };
    logger.trace('query: ', query);
    const response = await pgConnect.executeQuery(query);
    logger.info('app by secret key from db: ', response);
    return response[0];
  } catch (err) {
    throw new Error(err);
  }
};