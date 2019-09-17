const logger = require('tracer').colorConsole();
// const pgConnect = require('../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');

const addWebHookLog = async (OrderID, Gateway, GatewayTxnID, ResponseTxt) => {
  try {
    let query = {
      text: `INSERT INTO tbl_gateway_webhook_log
      (order_id, gateway, gateway_txn_id, response_txt, created_at)
      VALUES($1, $2, $3, $4, NOW());`,
      values: [OrderID, Gateway, GatewayTxnID, ResponseTxt]
    };
    let response = await pgConnect.executeQuery(query);
    logger.info('added web hook log successfully: ', response);
    return response;
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  addWebHookLog
};
