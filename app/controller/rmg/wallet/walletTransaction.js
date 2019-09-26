const config = require('config');
const logger = require('tracer').colorConsole();
// const pgConnect = require('../../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');
const rp = require('request-promise');

const walletTranxHistory = async (appId, playerId, page, limit) => {
  try {

    if (page == '' || page == undefined) {
      page = 1;
    }
    
    if (limit == '' || limit == undefined) {
      limit = 25
    }

    let query = {
      text: `SELECT wallet_txn_id, app_id, player_id, order_id, txn_type, "comment", total_balance, wallet_balance, mobile_no, amount as real_cash, cash_bonus, (amount::DECIMAL + cash_bonus::DECIMAL) as amount, currency, ip_address, device_id, user_agent, "status", ap_txn_id, ap_txn_status, response_txt, 
	created_at, updated_at, bank_name, chmod, pg_source, pg_txn_id, nz_txn_type, nz_txn_status, nz_txn_event, nz_txn_event_id, nz_txn_event_name, created_at::DATE created_dt FROM tbl_wallet_transaction_rmg where app_id = $4 and player_id = $1 and nz_txn_type not in ('RECON_DEBIT','RECON_CREDIT') and amount ~ '^[0-9\.]+$' = true order by updated_at desc LIMIT $2 OFFSET $3`,
      values: [playerId, limit, page, appId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('Fetch wallet transaction for a player:', response.length);
    return response;
  } catch(err) {
    throw(err);
  }
};

const getWalletTxnByOrderId = async (orderId) => {
  try {
    let query = {
      text: `select * from tbl_wallet_transaction_rmg where order_id = $1;`,
      values: [orderId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('wallet transaction found by order id: ', response[0]);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

const verifyTxnFromPaytm = async (orderId) => {
  try {
    let paytmConfig = config.paytm;
    url = `${paytmConfig.proxyUrl}app/v1/withdraw/txncheck/${orderId}`;
    let options = {
      uri: url,
      json: true
    };
    let paytmRes = await rp(options);
    logger.info('response from ', paytmRes);    
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  walletTranxHistory,
  getWalletTxnByOrderId,
  verifyTxnFromPaytm
};
