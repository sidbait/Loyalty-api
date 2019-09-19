const express = require('express');
const walletRouter = express.Router();

const walletController = require('../../controller/rmg/wallet/walletController');
const walletTranx = require('../../controller/rmg/wallet/walletTransaction');
const {validateChecksum} = require('../../auth/checksum');

const logger = require('tracer').colorConsole();

walletRouter.post('/credit', async (req, res) => {
  try {
    logger.info('in wallet credit routers.');
    // const {app} = res.locals;
    // logger.info('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const checksum = req.headers['checksum'];
    let secretKey = req.headers['x-nazara-app-secret-key'];
    let {
      airpay_token,
      amount,
      order_id,
      nz_txn_event,
      nz_txn_event_id,
      nz_txn_event_name,
      nz_txn_type,
      balance_type,
      pg_source,
      channel,
      pg_txn_id
    } = req.query;
    logger.debug('amount passed in query:', amount);
    //TODO: validate checksum if valid then, credit wallet transaction.
    // let param1 = `${airpay_token}$${order_id}$${amount}$CREDIT`;
    // if (!validateChecksum(checksum, param1, secretKey, app.app_id)) {
    //   throw({statusCode: 401, message: `Invalid Checksum.`});
    // }
    // wallet transaction.
    let response = await walletController.creditWallet(airpay_token, amount, order_id, nz_txn_event, nz_txn_event_id, nz_txn_event_name, nz_txn_type, balance_type, pg_source, channel, app, pg_txn_id);
    logger.info('response for wallet credit transaction: ', response);
    // return response;
    return res.status(200).send({
      success: 1,
      statusCode: 200,
      message: 'Success',
      data: response
    });
  } catch(err) {
    logger.error(err);
    let statusCode = err.statusCode ? err.statusCode : 500;
    return res.status(statusCode).send({
      success: 0,
      statusCode: statusCode,
      message: err.message,
      data: ''
    });
    // throw(err);
  }
});

walletRouter.post('/debit', async (req, res) => {
  try {
    logger.info('in wallet debit routers.');
    // const {app} = res.locals;
    // logger.info('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const checksum = req.headers['checksum'];
    let secretKey = req.headers['x-nazara-app-secret-key'];
    let {
      airpay_token,
      amount,
      order_id,
      nz_txn_event,
      nz_txn_event_id,
      nz_txn_event_name,
      nz_txn_type,
      balance_type,
      pg_source,
      channel,
      pg_txn_id
    } = req.query;
    logger.debug('amount passed in query:', amount);
    //TODO: validate checksum if valid then, credit wallet transaction.
    // let param1 = `${airpay_token}$${order_id}$${amount}$DEBIT`;
    // if (!validateChecksum(checksum, param1, secretKey, app.app_id)) {
    //   throw({statusCode: 401, message: `Invalid Checksum.`});
    // }
    // wallet transaction.
    let response = await walletController.debitWallet(airpay_token, amount, order_id, nz_txn_event, nz_txn_event_id, nz_txn_event_name, nz_txn_type, balance_type, pg_source, channel, app, pg_txn_id);
    logger.info('response for wallet debit transaction: ', response);
    // return response;
    return res.status(200).send({
      success: 1,
      statusCode: 200,
      message: 'Success',
      data: response
    });
  } catch(err) {
    logger.error(err);
    return res.status(500).send({
      success: 0,
      statusCode: 500,
      message: err.message,
      data: ''
    }); 
  }
});

walletRouter.get('/history', async (req, res) => {
  try {
    logger.info('In wallet transaction history router.');
    // const {app} = res.locals;
    // logger.debug('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const checksum = req.headers['checksum'];
    let secretKey = req.headers['x-nazara-app-secret-key'];
    let {page, limit} = req.query;
    // let param1 = `${page}$${limit}`;
    // // validate checksum.
    // if (!validateChecksum(checksum, param1, secretKey, app.app_id)) {
    //   throw({statusCode: 401, message: `Invalid Checksum.`});
    // }
    // fetch wallet transaction history for a player.
    let tranxHistory = await walletTranx.walletTranxHistory(app.appId, app.playerId, page, limit);
    logger.info('fetched tranx history from db: ', tranxHistory.length);
    return res.status(200).send({
      success: 1,
      statusCode: 200,
      message: 'Success',
      data: tranxHistory
    });
  } catch(err) {
    // throw(err);
    logger.error(err);
    return res.status(500).send({
      success: 0,
      statusCode: 500,
      message: err.message,
      data: ''
    });
  }
});

walletRouter.post('/paytm-create', async (req, res) => {
  try {
    logger.info('In paytm create route ......!');
    // const {app} = res.locals;
    // logger.info('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const checksum = req.headers['checksum'];

    let response = await walletController.paytmCreate(app, req.query);
    logger.info('response from paytm create process: ', response);
    return res.status(200).jsonp({
      success: 1,
      statusCode: 200,
      message: 'Success',
      data: response
    });
  } catch(err) {
    logger.error(err);
    let statusCode = err.statusCode ? err.statusCode : 500;
    return res.status(statusCode).send({
      success: 0,
      statusCode: statusCode,
      message: err.message,
      data: ''
    });
  }
});

walletRouter.post('/balance', async(req, res) => {
  try {
    logger.info('In wallet balance api route ......!');
    // const {app} = res.locals;
    // logger.info('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const checksum = req.headers['checksum'];
    let secretKey = req.headers['x-nazara-app-secret-key'];
    let {airpay_token} = req.query;

    // validate checksum.
    // let param1 = `${airpay_token}`;
    // if (!validateChecksum(checksum, param1, secretKey, app.app_id)) {
    //   throw({statusCode: 401, message: `Invalid Checksum.`});
    // }

    let balanceResponse = await walletController.playerWalletBalDetail(app);
    logger.info('get player wallet balance response: ', balanceResponse);
    return res.status(200).jsonp({
      success: 1,
      statusCode: 200,
      message: 'Success',
      data: balanceResponse
    })
  } catch(err) {
    logger.error(err);
    let statusCode = err.statusCode ? err.statusCode : 500;
    return res.status(statusCode).send({
      success: 0,
      statusCode: statusCode,
      message: err.message,
      data: ''
    });
  }
});

walletRouter.post('/paytm-update', async(req, res) => {
  try {
    logger.info('update paytm transaction record.');
    // const {app} = res.locals;
    // logger.info('app', app);
    logger.info(req.appId);
    logger.info(req.userDetails);
    const app = req.userDetails;
    const {order_id} = req.query;
    let updatedResponse = await walletController.paytmWalletUpdate(app, order_id);
    return res.status(200).jsonp({
      success: 1,
      statusCode: 200,
      message: 'Status Updated',
      data: updatedResponse
    })
  } catch(err) {
    logger.error(err);
    let statusCode = err.statusCode ? err.statusCode : 500;
    return res.status(statusCode).send({
      success: 0,
      statusCode: statusCode,
      message: err.message,
      data: err.data ? err.data : ''
    });
  }
});

module.exports = walletRouter;
