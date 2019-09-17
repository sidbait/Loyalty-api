const logger = require('tracer').colorConsole();
const pgConnect = require('../model/pgConnections');


const bonusCredit = async (playerId, bonus) => {
  try {
    let query = {
      text: `INSERT INTO tbl_bonus(player_id, bonus, created_at, updated_at) values($1, $2, NOW(), NOW())
      ON CONFLICT(player_id) DO UPDATE set bonus = (select bonus from tbl_bonus where player_id = $1 limit 1) + excluded.bonus, updated_at = NOW() RETURNING *;`,
      values: [playerId, bonus]
    };
    let creditBonus = await pgConnect.executeQuery(query);
    logger.info('bonus credit for a player:', creditBonus[0]);
    return creditBonus[0];
  } catch(err) {
    throw new Error(err);
  }
};

const bonusDebit = async (playerId, bonus) => {
  try {
    let query = {
      text: `update tbl_bonus set bonus = bonus - $2
      where player_id = $1 and bonus >= $2 RETURNING *;`,
      values: [playerId, bonus]
    };
    let debitBonus = await pgConnect.executeQuery(query);
    logger.info('bonus debited for a player:', debitBonus[0]);
    return debitBonus[0];
  } catch(err) {
    throw new Error(err);
  }
};

const bonusTransactionInit = async (appId, playerId, eventType, eventName, eventTypeId, bonusType, bonusValue, comment, fromPlayerId, responseTxt) => {
  try {
    let status = '';

    if (bonusType == 'CREDIT') {
      let response = await bonusCredit(playerId, bonusValue);
      if (response && response.player_id) {
        status = 'SUCCESS';
      } else {
        status = 'FAILED';
      }
    } else if (bonusType == 'DEBIT') {
      let response = await bonusDebit(playerId, bonusValue);
      if (response && response.player_id) {
        status = 'SUCCESS';
      } else {
        status = 'NOBALANCE';
      }
    }

    let query = {
      text: `insert into tbl_bonus_transaction(app_id, player_id, event_type, event_name, event_type_id, bonus_type, bonus_value, comment, from_player_id, status, response_txt, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9 , $10, $11,NOW(),NOW()) RETURNING *;`,
      values: [appId, playerId, eventType, eventName, eventTypeId, bonusType, bonusValue, comment, fromPlayerId, status, responseTxt]
    };
    let transactionResponse = await pgConnect.executeQuery(query);
    logger.info('Bonus Transaction:', transactionResponse[0]);
    return {status, bonus: transactionResponse}
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  bonusTransactionInit
}
