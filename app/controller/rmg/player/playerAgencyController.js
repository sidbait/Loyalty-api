const logger = require('tracer').colorConsole();
// const pgConnect = require('../../model/pgConnections');
const pgConnect = require('../../../model/pgConnection');

async function createPlayerAgency() {
  try {
    let query = {
      text: `insert into tbl_player_agency (player_id, agency_name, agency_para, agency_pubid, click_id, created_at) values () ON CONFLICT DO NOTHING RETURING *;`,
      values: []
    };
    let playerAgency = await pgConnect.executeQuery(query);
    logger.debug('created player agency record successfully into db: ', playerAgency);
    return playerAgency;
  } catch (err) {
    throw new Error(err);
  }
};

async function getAgencyDetails(playerId) {
  try {
    let query = {
      text: `select p.player_id, p."source", a.agency_name, a.agency_para, a.agency_pubid, a.click_id from tbl_player p
      left join tbl_player_agency a on a.player_id = p.player_id
      where p.player_id = $1 limit 1;`,
      values: [playerId]
    };
    let agency = await pgConnect.executeQuery(query);
    logger.debug('agency details by playerId: ', agency[0]);
    return agency[0];
  } catch(err) {
    throw(err);
  }
};

async function addPixelLog(playerId, source, clickId, event, url, res, status) {
  try {
    let query = {
      text: `INSERT INTO tbl_pixel_fire_log (player_id, "source", click_id, event_name, pixel_url, url_response, status, created_at) 
      VALUES(?, ?, ?, ?, ?, ?, ?, now());`,
      values: [playerId, source, clickId, event, url, res, status]
    };
    let pixelLog = await pgConnect.executeQuery(query);
    logger.debug('pixel added in log: ', pixelLog[0]);
    return pixelLog[0];
  } catch(err) {
    throw(err);
  }
};

async function getPixelMaster(source, eventType) {
  try {
    let query = {
      text: `SELECT id, "source", pixel_url, event_type, pixel_block, status, created_at, created_by, updated_at, updated_by
      FROM tbl_pixel_master where status = 'ACTIVE' and LOWER(source) = $1 and event_type = $2 limit 1;`,
      values: [source, eventType]
    };
    let pixelMaster = await pgConnect.executeQuery(query);
    logger.debug('pixel master source data: ', pixelMaster[0]);
    return pixelMaster[0];
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  createPlayerAgency,
  getAgencyDetails,
  addPixelLog,
  getPixelMaster
};
