const logger = require('tracer').colorConsole();
// const pgConnect = require('../../model/pgConnections');
const walletBalanceController = require('./walletBalance');
const walletCreditQueueCtrl = require('./walletCreditQueue');
const walletTranxController = require('./walletTransaction');
// const playerController = require('../playerController');
const playerController = require('../player/playerController');
// const {toCamelCaseKeys} = require('../../ultility/utility');
const {toCamelCaseKeys} = require('../../../ultility/utility');
// const paytm = require('../../ultility/paytm');
const paytm = require('../../../ultility/paytm');
// const webHookLogController = require('../webHooklog.controller');
const webHookLogController = require('./webHooklog.controller');

async function creditWallet(airpayToken, amount, orderId, nzTxnEvent, nzTxnEventId, nzTxnEventName, nzTxnType, balance_type, pgSource, channel, app, pgTxnId) {
  try {
    logger.info('Into wallet controller.....!', app);
    let walletBalance = 0;
    // check if balance type equal to '' or undefined.
    // if yes then assigning balance type value to reward.
    if (balance_type == '' || balance_type == undefined) {
      balance_type = 'REWARD';
    }
    // checking if nzTxnType equal to '' or undefined
    // if yes then assigning
    if (nzTxnType == '' || nzTxnType == undefined) {
      nzTxnType = 'CREDIT';
    }
    // checking if pgSource equal to '' or undefined
    // if yes then assigning pgSource value to AIRPAY.
    if (pgSource == '' || pgSource == undefined) {
      pgSource = 'AIRPAY';
    }
    // Get player details from 
    let player = await playerController.getPlayerById(app.playerId);
    // logger.debug('player details:', player);
    // check balance type
    // depanding on balance need to perform operation.
    if (balance_type == 'WINNING') {
      logger.trace('transaction for winning balance type.');
      // add record into 'tbl_wallet_transaction' table.
      let walletTranx = await walletBalanceController.addWalletTransaction(app.appId, app.playerId, orderId, player.mobile_number, amount, '', '', '', '', 'SUCCESS', '', '', '', nzTxnType, '', '', pgSource, pgTxnId, 'SUCCESS', nzTxnEvent, nzTxnEventId, nzTxnEventName, '0', channel);
      // credit winning balance for player.
      let creditWallet = await walletBalanceController.creditWinningBalance(app.appId, app.playerId, walletTranx.wallet_txn_id, 'CREDIT', 0, walletTranx.amount);
      walletBalance = Number(creditWallet.reward_balance) + Number(creditWallet.winning_balance) + Number(creditWallet.deposit_balance);
      // update wallet credit queue 
      walletCreditQueueCtrl.updateSuccess(orderId, app.playerId, nzTxnEventId);
    } else {
      logger.trace('transaction for reward balance type.');
      // get player wallet balance details.
      playerBalance = await playerController.getPlayerWalletBalance(app.playerId);
      walletBalance = Number(playerBalance.reward_balance) + Number(playerBalance.winning_balance) + Number(playerBalance.deposit_balance);
      // add record into 'tbl_wallet_transaction' table.
      let walletTranx = await walletBalanceController.addWalletTransaction(app.appId, app.playerId, orderId, player.phone_number, amount, '', '', '', '', 'SUCCESS', '', '', '', nzTxnType, walletBalance, '', pgSource, pgTxnId, 'SUCCESS', nzTxnEvent, nzTxnEventId, nzTxnEventName, amount, channel);
      // credit reward balance for a player.
      let wallet = await walletBalanceController.creditRewardBalance(app.appId, app.playerId, walletTranx.wallet_txn_id, 'CREDIT', 0, amount);
      // update wallet credit queue 
      walletCreditQueueCtrl.updateSuccess(orderId, app.playerId, nzTxnEventId);
    }

    responseObj = {
      TRANSACTION: {
        'CHMOD': '',
        'TRANSACTIONSTATUS': '200',
        'MESSAGE': '',
        'MERCHANTID': '',
        'USERNAME': player.phone_number,
        'TRANSACTIONID': orderId,
        'APTRANSACTIONID': '',
        'AMOUNT': amount,
        'CURRENCYCODE': '',
        'TRANSACTIONTIME': Date.now().toString(),
        'WALLETBALANCE': walletBalance
      }
    };
    return responseObj;
  } catch(err) {
    throw(err);
  }
};

async function debitWallet(airpay_token, amount, order_id, nz_txn_event, nz_txn_event_id, nz_txn_event_name, nz_txn_type, balance_type, pg_source, channel, app, pg_txn_id) {
  try {
    logger.info('Into wallet controller to debit wallet.....!', app);
    let walletBalance, amountToDebit, bonusAmount = 0;
    let flag = false;
    // check if balance type passed.
    if (balance_type == '' || balance_type == undefined) {
      balance_type = 'DEBIT';
    }
    // check if nzTxnType is been passed.
    if (nz_txn_type == '' || nz_txn_type == undefined) {
      nz_txn_type = 'DEBIT';
    }
    // Get player details from db.
    let player = await playerController.getPlayerById(app.playerId);
    // get wallet balance for a player.
    let balance = await playerController.getPlayerWalletBalance(app.playerId);

    // check balance type and do operation accordingly.
    if (balance_type == 'WITHDRAW') {
      if (Number(balance.winning_balance) >= Number(amount)) {
        amountToDebit = amount;
        flag = true;
      }
    } else if (balance_type == 'DEBIT') {
      if (Number(balance.winning_balance) + Number(balance.reward_balance) + Number(balance.deposit_balance) >= Number(amount)) {
        flag = true;
        let debitAmount = Number(balance.reward_balance) - Number(amount);
        if (debitAmount < 0) {
          bonusAmount = balance.reward_balance;
          amountToDebit = Number(amount) - Number(balance.reward_balance);
        } else {
          bonusAmount = amount;
          amountToDebit = 0;
        }
      }
    }
    if (flag) {
      if (amountToDebit == 0) {
        // create wallet transaction record in db.
        let walletTranx = await walletBalanceController.addWalletTransaction(app.appId, app.playerId, order_id, app.phone_number, amountToDebit, 'INR', '', '', '', 'SUCCESS', order_id, '200', '', nz_txn_type, '', '', pg_source, pg_txn_id, 'SUCCESS', nz_txn_event, nz_txn_event_id, nz_txn_event_name, bonusAmount, channel);
        logger.debug('wallet transaction created successfully:');
        // debit all wallet balance type.
        let balResponse = await walletBalanceController.debitAllBalance(balance, amount, app.appId, app.playerId, walletTranx.wallet_txn_id, 'DEBIT');

        walletBalance = Number(balResponse.reward_balance) + Number(balResponse.winning_balance) + Number(balResponse.deposit_balance);
      } else {
        let walletTranx = await walletBalanceController.addWalletTransaction(app.appId, app.playerId, order_id, app.phone_number, amountToDebit, 'INR', '', '', '', 'SUCCESS', order_id, '200', '', nz_txn_type, '', '', pg_source, pg_txn_id, 'SUCCESS', nz_txn_event, nz_txn_event_id, nz_txn_event_name, bonusAmount, channel);
        logger.debug('wallet transaction created successfully:');
        let balResponse;
        if (balance_type == 'WITHDRAW') {
          // debit winining balance.
          balResponse = await walletBalanceController.debitWinningBalance(app.playerId, walletTranx.amount, walletTranx.wallet_txn_id, 'WITHDRAW');
        } else if (balance_type == 'DEBIT') {
          // debit all balance.
          balResponse = await walletBalanceController.debitAllBalance(balance, amount,  app.appId, app.playerId, walletTranx.wallet_txn_id, 'DEBIT');
        }
        walletBalance = Number(balResponse.reward_balance) + Number(balResponse.winning_balance) + Number(balResponse.deposit_balance);

        // update wallet transaction status.
        let updatedTransaction = await walletBalanceController.udpateWalletTxnStatus(walletTranx.wallet_txn_id, 'SUCCESS', walletBalance);

      }

      responseObj = {
        TRANSACTION: {
          'CHMOD': '',
          'TRANSACTIONSTATUS': '200',
          'MESSAGE': '',
          'MERCHANTID': '',
          'USERNAME': player.phone_number,
          'TRANSACTIONID': order_id,
          'APTRANSACTIONID': '',
          'AMOUNT': amount,
          'CURRENCYCODE': '',
          'TRANSACTIONTIME': Date.now().toString(),
          'WALLETBALANCE': walletBalance
        }
      };
      return responseObj;
    } else {
      logger.error('no balance available ..!');
      throw(`no balance available ..!`);
    }
  } catch(err) {
    throw({statusCode: 401, message: `${err.message}`});
  }
};

async function walletTranxHistory() {
  try {
    logger.info('wallet transaction history api controller.');
  } catch (err) {
    throw(err);
  }
};

async function paytmCreate(app, query) {
  try {
    logger.debug('in paytm create controller');
    let {
      mobile,
      amount,
      currency,
      ip_address,
      device_id,
      user_agent,
      txn_type,
      comment,
      m_id,
      txn_date,
      status,
      order_id,
      ap_txn_id,
      ap_txn_status,
      response_txt,
      wallet_balance,
      pg_source,
      pg_txn_id,
      txn_id,
      payment_mode,
      resp_code,
      resp_msg,
      gateway_name,
      bank_txn_id,
      bank_name,
      checksum,
      nz_txn_event,
      nz_txn_event_id,
      nz_txn_event_name,
      channel
    } = query;
    logger.info('add wallet transaction for paytm');
    let walletTranx = await walletBalanceController.addWalletTransaction(app.appId, app.playerId, order_id, mobile, amount, currency, ip_address, device_id, user_agent, status, ap_txn_id, ap_txn_status, response_txt, txn_type, wallet_balance, comment, pg_source, pg_txn_id, 'PENDING', nz_txn_event, nz_txn_event_id, nz_txn_event_name, 0, channel);

    logger.debug('wallet transaction created successfully for paytm.');

    if (pg_source == 'PAYTM') {
      logger.info('pg_source paytm is been passed.');
      let paytmWalletTranx = await walletBalanceController.addPaytmWalletTranx(app.playerId, app.appId, order_id, m_id, txn_id, amount, payment_mode, currency, txn_date, status, resp_code, resp_msg, gateway_name, bank_txn_id, bank_name, checksum);
      logger.info('paytm wallet transaction created successfully.', paytmWalletTranx);

    } 
    // else {
    //   logger.info('generate response.');
    //   return walletTranx;
    // }
    let camelCaseResponse = toCamelCaseKeys(walletTranx);
    return camelCaseResponse;
  } catch(err) {
    throw(err);
  }
};

async function playerWalletBalDetail(app) {
  try {
    logger.info('get complete player details...! ');
    let playerDetail = await playerController.getPlayerDetailsById(app.playerId);
    logger.debug('get player detail successfully.');
    if (!playerDetail || !playerDetail.player_id) {
      throw({statusCode: 401, message: 'Unauthorized'});
    }
    let walletBalance = await playerController.getPlayerWalletBalance(app.playerId);
    logger.debug('get players wallet balance successfully.');
    responseObj = {
      TRANSACTION: {
        'TRANSACTIONSTATUS': '200',
        'USERNAME': playerDetail.phone_number,
        'NZBonus': walletBalance.bonus,
        'WinningBalance': walletBalance.winning_balance,
        'RewardBalance': walletBalance.reward_balance,
        'DepositBalance': walletBalance.deposit_balance,
        'WALLETBALANCE': Number(walletBalance.winning_balance) + Number(walletBalance.reward_balance) + Number(walletBalance.deposit_balance),
        'TRANSACTIONTIME': Date.now().toString(),
      }
    };
    return responseObj;
  } catch(err) {
    throw(err);
  }
};

async function paytmWalletUpdate(app, orderId) {
  try {
    logger.info('update paytm wallet transaction.');
    let txn = await walletTranxController.getWalletTxnByOrderId(orderId);
    logger.debug('fetch wallet transaction successfully.');
    //TODO: check for duplicate entry in tbl_wallet_balance_log on txn_id
    let walletDetail;
    if (txn.pg_source == 'PAYTM') {
      logger.info('this is for paytm.');
      if (txn.nz_txn_type == 'DEPOSIT') {
        // verify transaction from paytm.
        // paytmTxn = await walletTranxController.verifyTxnFromPaytm(orderId);
        // logger.debug('paytm transaction response from paytm: ', paytmTxn);
        let paytmTxn = await paytm.checkPaytmStatus(txn.order_id);
        logger.info('payment transaction status from paytm: ');
        // let toStrigify = paytmTxn;
        let jsonStr = JSON.stringify(paytmTxn);
        walletBalanceController.paytmWalletTransactionUpdate(paytmTxn.STATUS, paytmTxn.RESPCODE, paytmTxn.RESPMSG, paytmTxn.GATEWAYNAME, paytmTxn.BANKTXNID, paytmTxn.BANKNAME, "", paytmTxn.ORDERID, jsonStr, paytmTxn.TXNID, paytmTxn.PAYMENTMODE, paytmTxn.TXNDATE);

        //TODO: add to gateway webhook.
        webHookLogController.addWebHookLog(orderId, 'PAYTM', paytmTxn.TXNID, jsonStr);
        
        paytmTxn = JSON.parse(paytmTxn);
        // logger.info('paytm transaction status success',typeof paytmTxn);
        // If success update the status and add the balance to the wallet and credit the amount to the wallet.
        if (paytmTxn.status == 'TXN_SUCCESS' || paytmTxn.STATUS == 'TXN_SUCCESS') {
          //TODO: get player by id.
          logger.info('paytm transaction status success');
          walletDetail = await walletBalanceController.updateWalletTxnOrder('', '200', orderId, '', txn.amount, 'INR', 'PAYTM', paytmTxn.TXNID, paytmTxn.ORDERID, 'SUCCESS');
          logger.info('wallet transaction updated successfully.');

          // update wallet for deposit
          let walletBal = await walletBalanceController.creditDepositBalance(app.playerId, walletDetail.wallet_txn_id, 'DEPOSIT', 0, walletDetail.amount);
          logger.debug('credited deposit balance successfully. ');

        } else if (paytmTxn.status == 'TXN_SUCCESS' || paytmTxn.STATUS == 'TXN_FAILURE') {
          logger.info('paytm transaction status failure');
          walletDetail = await walletBalanceController.updateWalletTxnByOrderId(txn.order_id, paytmTxn.RESPCODE, '', paytmTxn.STATUS, jsonStr, '', 'PAYTM', paytmTxn.TXNID, 'FAILED');
        }
      } else {
        throw({statusCode: 201, message: 'Currently Handling only Deposit', data: txn});
      }
    }
    return walletDetail;
  } catch(err) {
    throw(err);
  }
}

module.exports = {
  creditWallet,
  debitWallet,
  paytmCreate,
  playerWalletBalDetail,
  paytmWalletUpdate
};
