const logger = require('tracer').colorConsole();
// const pgConnect = require('../../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');

const updateSuccess = async (txnId, playerId, eventId) => {
  try {
    let query = {
      text: `update tbl_wallet_credit_que set "status" = 'SUCCESS', transaction_date = NOW(), transaction_id = $1, is_credit = true where player_id = $2 and event_id = $3 RETURNING *;`,
      values: [txnId, playerId, eventId]
    };
    let response = pgConnect.executeQuery('loyalty',query);
    logger.info('update success to wallet credit queue:', response[0]);
    return response[0];
  } catch(err) {
    throw new Error(err);
  }
};

module.exports = {
  updateSuccess
};
