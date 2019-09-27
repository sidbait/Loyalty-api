const logger = require('tracer').colorConsole();
// const pgConnect = require('../../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');

async function initBalance(playerId) {
  try {
    let query = {
      text: `insert into tbl_wallet_balance(player_id, winning_balance, reward_balance, deposit_balance, created_at, updated_at)
      values($1, 0, 0, 0, NOW(), NOW()) returning *;`,
      values: [playerId]
    };
    let init = await pgConnect.executeQuery('loyalty',query);
    logger.info('initialized the wallet balance for a player', init[0]);
    return init[0];
  } catch(err) {
    throw new Error(err);
  }
};

async function addWalletTransaction(appId, playerId, orderId, mobileNo, amount, currency, ipAddress, deviceId, userAgent, status, apTxnId, apTxnStatus, responseTxt, txnType, WalletBalance, comment, pgSource, pgTxnId, nzTxnStatus, nzTxnEvent, nzTxnEventId, nzTxnEventName, bonus, channel) {
  try {
    if (apTxnId == undefined || apTxnId == '') {
      apTxnId = null;
    }

    //TODO: channel was remove in creation, need to confirm if required or have been removed.
    let query = {
      text: `insert into tbl_wallet_transaction_rmg (app_id, player_id, order_id, mobile_no, amount, currency, ip_address, device_id, user_agent, nz_txn_status, ap_txn_id, ap_txn_status, response_txt, nz_txn_type, wallet_balance, comment, pg_source, pg_txn_id, created_at, updated_at, nz_txn_event, nz_txn_event_id, nz_txn_event_name, cash_bonus)
      values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now(), now(), $19, $20, $21, $22) RETURNING tbl_wallet_transaction_rmg.*;`,
      values: [appId, playerId, orderId, mobileNo, amount, currency, ipAddress, deviceId, userAgent, status, apTxnId, apTxnStatus, responseTxt, txnType, WalletBalance, comment, pgSource, pgTxnId, nzTxnEvent, nzTxnEventId, nzTxnEventName, bonus]
    };
    let tranx = await pgConnect.executeQuery('loyalty',query);
    logger.info('wallet transaction: ', tranx[0]);
    return tranx[0];
  } catch(err) {
    logger.error(err);
    //TODO: update failure
    throw({statusCode: 201, message: err.message});
    // throw new Error(err);
  }
};

async function creditRewardBalance(appId, playerId, txnId, txnType, walletBalance, amount) {
  try {
    logger.log('amount', amount);
    logger.log('amount', typeof amount);
    amount = Number(amount);
    let query = {
      text: `insert into tbl_wallet_balance(app_id, player_id, winning_balance, reward_balance, deposit_balance, created_at, updated_at)
      values($1, $2, 0, $3, 0, NOW(), NOW())
      ON CONFLICT (player_id, app_id)
      DO UPDATE SET reward_balance = excluded.reward_balance + (select reward_balance from tbl_wallet_balance where player_id = $2 and app_id = $1), updated_at = NOW()
      returning *;`,
      values: [appId, playerId, amount]
    };
    let balance = await pgConnect.executeQuery('loyalty',query);
    logger.info('credit reward balanace into db: ', balance[0]);
    let log = await addLog(appId, playerId, balance, txnId, txnType, walletBalance, amount);
    // logger.info('log created for wallet balance:', log);
    return balance[0];
  } catch (err) {
    throw new Error(err);
  }
};

async function creditWinningBalance(appId, playerId, txnId, txnType, walletBalance, amount) {
  try {
    let query = {
      text: `insert into tbl_wallet_balance(app_id, player_id, winning_balance, reward_balance, deposit_balance, created_at, updated_at) values($1, $2, $3, 0, 0, NOW(), NOW())
      ON CONFLICT (player_id, app_id)
      DO UPDATE SET winning_balance = excluded.winning_balance + (select winning_balance from tbl_wallet_balance where player_id = $2 and app_id = $1), updated_at = NOW() returning *;`,
      values: [appId, playerId, amount]
    };
    let creditBalance = await pgConnect.executeQuery('loyalty', query);
    logger.info('credited winning balance for a player into db: ', creditBalance[0]);

    // add log
    let log = await addLog(appId, playerId, creditBalance, txnId, txnType, walletBalance, amount);
    logger.info('log created for wallet balance:', log[0]);
    return creditBalance[0];
  } catch(err) {
    logger.error(err);
    throw new Error(err);
  }
};

async function creditDepositBalance(appId, playerId, txnId, txnType, walletBalance, amount) {
  try {
    let query = {
      text: `insert into tbl_wallet_balance(app_id, player_id, winning_balance, reward_balance, deposit_balance, created_at, updated_at)
      values($1, $2, 0, 0, $3, NOW(), NOW())
      ON CONFLICT (player_id, app_id)
      DO UPDATE SET deposit_balance = excluded.deposit_balance + (select deposit_balance from tbl_wallet_balance where player_id = $2 and app_id = $1), updated_at = NOW()
      returning *;`,
      values: [appId, playerId, amount]
    };
    let creditDeposit = await pgConnect.executeQuery('loyalty',query);
    logger.info('credited deposit balance for a player into db: ', creditDeposit[0]);
    // add log
    let log = await addLog(appId, playerId, creditDeposit[0], txnId, txnType, walletBalance, amount);
    logger.info('log created for wallet balance:');
    return creditDeposit[0];
  } catch(err) {
    logger.error(err);
    throw new Error(err);
  }
};

async function addLog(appId, playerId, balance, txnId, txnType, walletBalance, amount) {
  try {
    let query = {
      text: `insert into tbl_wallet_balance_log
      (app_id, player_id, txn_id, txn_type, amount, reward_balance, deposit_balance, winning_balance, wallet_balance, created_at)
      values($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) returning *;`,
      values: [appId, playerId, txnId, txnType, amount, balance.reward_balance, balance.deposit_balance, balance.winning_balance, walletBalance]
    };
    let logCreated = await pgConnect.executeQuery('loyalty', query);
    logger.info('log created for wallet balance:', logCreated[0]);
    return logCreated[0];
  } catch (err) {
    logger.error('wallet balance log error:', err);
    throw new Error(err);
  }
}

async function debitAllBalance(wBal, amount, appId, playerId, txnId, txnType) {
  try {
    logger.info('txnId:', txnId , 'txnType:', txnType);
    let bal = {...wBal};
    let balAmt = 0;
    let amountPass = amount;
    if (bal.reward_balance > 0 && amount > 0) {
      balAmt = Number(bal.reward_balance) - Number(amount);
      if (balAmt < 0) {
        amount = Number(amount) - Number(bal.reward_balance);
        bal.reward_balance = 0
      } else {
        bal.reward_balance = Number(bal.reward_balance) - Number(amount);
        amount = 0;
      }
    }
    logger.info('amount: ', amount, 'bal amount:', balAmt, 'balance object:', bal);
    if (bal.deposit_balance > 0 && amount > 0) {
      balAmt = Number(bal.deposit_balance) - Number(amount);
      if (balAmt < 0) {
        amount = Number(amount) - Number(bal.deposit_balance);
        bal.deposit_balance = 0
      } else {
        bal.deposit_balance = Number(bal.deposit_balance) - Number(amount);
        amount = 0;
      }
    }
    logger.info('amount: ', amount, 'bal amount:', balAmt, 'balance object:', bal);
    if (bal.winning_balance > 0 && amount > 0) {
      balAmt = Number(bal.winning_balance) - Number(amount);
      if (balAmt < 0) {
        amount = Number(amount) - Number(bal.winning_balance);
        bal.winning_balance = 0
      } else {
        bal.winning_balance = Number(bal.winning_balance) - Number(amount);
        amount = 0;
      }
    }
    logger.info('amount: ', amount, 'bal amount:', balAmt, 'balance object:', bal);

    let query = {
      text: `update tbl_wallet_balance 
			set winning_balance = $1, deposit_balance = $2, reward_balance = $3
			where player_id = $4 and app_id = $5 returning *;`,
      values: [bal.winning_balance, bal.deposit_balance, bal.reward_balance, playerId, appId]
    };
    let debitAll = await pgConnect.executeQuery('loyalty',query);
    logger.info('Debited all wallet balance type:', debitAll[0]);

    // add log.
    let log = await addLog(appId, playerId, debitAll, txnId, txnType, amountPass);
    logger.info('log created for wallet balance:', log)
    return debitAll[0];
  } catch(err) {
    throw(err);
  }
};

async function debitWinningBalance(playerId, amount, txnId, txyType) {
  try {
    let query = {
      text: `update tbl_wallet_balance 
      set winning_balance =  (select winning_balance - $2 from tbl_wallet_balance where player_id = $1)
      where player_id = $1 and winning_balance >= $2 returning *;`,
      values: [playerId, amount]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('debit winnning balance for a player: ', response[0]);
    // add log.
    let log = await addLog(playerId, response, txnId, txyType, amount);
    logger.info('log created for wallet balance:', log[0])
    return response[0];
  } catch(err) {
    throw(err);
  }
};

async function udpateWalletTxnStatus(walletTxnId, status, walletBalance) {
  try {
    let query = {
      text: `update tbl_wallet_transaction_rmg set 
      updated_at = NOW(), nz_txn_status = ?, wallet_balance = ? 
      where wallet_txn_id = ? RETURNING tbl_wallet_transaction.*;`,
      values: [status, walletBalance, walletTxnId]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('wallet balance updated successfully: ', response[0]);
    return response[0];
  } catch(err) {
    //TODO: update wallet transaction status 'failed'.
    throw(err);
  }
};

async function addPaytmWalletTranx(playerId, appId, order_id, m_id, txn_id, txn_amount, payment_mode, currency, txn_date, status, resp_code, resp_msg, gateway_name, bank_txn_id, bank_name, checksum) {
  try {
    let query = {
      text: `insert into tbl_wallet_paytm_txn
      (player_id, app_id, order_id, m_id, txn_id, txn_amount, payment_mode, currency, txn_date, status, resp_code, resp_msg, gateway_name, bank_txn_id, bank_name, checksum, created_at)
      values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now()) RETURNING paytm_txn_id, player_id, app_id, order_id, m_id, txn_id, txn_amount, payment_mode, currency, txn_date, status, resp_code, resp_msg, gateway_name, bank_txn_id, bank_name, checksum;`,
      values: [playerId, appId, order_id, m_id, txn_id, txn_amount, payment_mode, currency, txn_date, status, resp_code, resp_msg, gateway_name, bank_txn_id, bank_name, checksum]
    };
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('paytm wallet created successfully: ', response[0]);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

async function paytmWalletTransactionUpdate(status, respCode, respMsg, gatewayName, bankTxnId, bankName, checksum, orderId, resp_text, txnId, paymentMode, txnDate) {
  try {
    let query = {
      text: `update tbl_wallet_paytm_txn set status = $1, resp_code = $2, resp_msg = $3, gateway_name = $4, bank_txn_id = $5, bank_name = $6, checksum = $7, resp_text = $8, updated_at = NOW(), txn_id = $9, payment_mode = $10, txn_date = $11
      where order_id = $12 RETURNING paytm_txn_id, player_id, app_id;`,
      values: [status, respCode, respMsg, gatewayName, bankTxnId, bankName, checksum, resp_text, txnId, paymentMode, txnDate, orderId]
    };
    let response = await pgConnect.executeQuery('loyalty', query);
    logger.info('paytm wallet transaction table updated for table: ', response[0]);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

async function updateWalletTxnByOrderId(orderId, status, apTxnId, apTxnStatus, responseTxt, walletBalance, pgSource, pgTxnId, nzStatus) {
  try {
    let queryString = `UPDATE tbl_wallet_transaction_rmg
    SET  status= $1 ,  ap_txn_id = $2 , ap_txn_status = $3, response_txt = $4, pg_source = $5, pg_txn_id= $6, nz_txn_status = $7, `;
    if (walletBalance && walletBalance != '' && walletBalance != null) {
      queryString += `wallet_balance = '${walletBalance}', `;
    }
    queryString += `updated_at = NOW() where order_id = $8 RETURNING *;`;
    if (apTxnId != '' && apTxnId != null && apTxnId) {
      apTxnId = null
    }
    let query = {
      text: queryString,
      values: [status, apTxnId, apTxnStatus, responseTxt, pgSource, pgTxnId, nzStatus, orderId]
    };
    let response = pgConnect.executeQuery('loyalty',query);
    logger.info('update wallet transaction by order id: ', response[0]);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

async function updateWalletTxnOrder(chmod, apTxnStatus, apTxnId, resStr, amount, currency, pgSource, pgTxnId, orderId, status) {
  try {
    let queryString = `update tbl_wallet_transaction_rmg set chmod = $1, ap_txn_status = $2, ap_txn_id = $3, response_txt = $4, amount = $5, currency = $6, pg_source = $7, pg_txn_id= $8, updated_at = NOW(), status = $9, nz_txn_status = $9 where order_id = $10 RETURNING *;`;


    if (apTxnId != '' && apTxnId != null && apTxnId) {
      apTxnId = null
    }

    let query = {
      text: queryString,
      values: [chmod, apTxnStatus, apTxnId, resStr, amount, currency, pgSource, pgTxnId, status, orderId]
    };
    logger.debug('query: ', query);
    let response = await pgConnect.executeQuery('loyalty',query);
    logger.info('update wallet transaction by order id: ', response);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

async function getDebitMatrix(code) {
  try {
    let query = {
      text: `select matrix_id, matrix_code, reward_balance, deposit_balance, winning_balance, fallback, status from tbl_wallet_debit_matrix where matrix_code = $1 limit 1;`,
      values: [code]
    };
    let response = await pgConnect.executeQuery('loyalty', query);
    logger.info('ddebit matrix code for a code passed: ', response[0]);
    return response[0];
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  initBalance,
  addWalletTransaction,
  creditDepositBalance,
  creditRewardBalance,
  creditWinningBalance,
  debitAllBalance,
  debitWinningBalance,
  udpateWalletTxnStatus,
  addPaytmWalletTranx,
  paytmWalletTransactionUpdate,
  updateWalletTxnByOrderId,
  updateWalletTxnOrder,
  getDebitMatrix
};
