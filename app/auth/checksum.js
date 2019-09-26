const logger = require('tracer').colorConsole();
const md5 = require('md5');
const sha512 = require('js-sha512');

const validateChecksum = (checkSumPassed, param1, appSecret, appId) => {
  let md5Generated, checkSumGenerated = '';
  // md5 param1
  let md5P1 = md5(param1);
  logger.info('param1: ', param1, 'md5: ', md5P1);
  // md5 param2
  let param2 = `${appSecret}$${appId}`;
  let md5P2 = md5(param2);
  logger.info('param2: ', param2, 'md5: ', md5P2);
  //TODO: need to remove date from checksum generation. (as suggested by rajesh)
  // md5 param3
  let dateNow = new Date();
  let param3 = `${dateNow.getFullYear()}-${dateNow.getMonth()}-${dateNow.getDay()}`;
  let md5P3 = md5(param3);
  logger.info('param3: ', param3, 'md5: ', md5P3);

  if (param1 == '' || param1 == undefined) {
    md5Generated = `${md5P2}|${md5P3}`;
  } else {
    md5Generated = `${md5P1}|${md5P2}|${md5P3}`;
  }
  logger.info('md5: ', md5Generated);
  // generated checksum
  checkSumGenerated = sha512(md5Generated);
  logger.debug('checksum generated : ', checkSumGenerated);
  // verify checksum
  if (checkSumGenerated == checkSumPassed) {
    logger.info('checksum verified successfully...!');
    return true;
  } else {
    logger.error('checksum verification failed ...!');
    
  }
  return false;
};

module.exports = {
  validateChecksum
};
