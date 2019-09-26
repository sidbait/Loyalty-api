const config = require('config');
const logger = require('tracer').colorConsole();

function randomNumber(size) {
  let randomString = '';
  for(let i = 0; i < size; i++) {
    randomString += Math.floor((Math.random() * 9) + 1);
  }
  return randomString;
};

function generateOtpMessage(opt) {
  let partner = config.partner;
  logger.info('partner in config file: ', partner);
  let message = '';
  switch(true) {
    case partner === 'CR':
      message = `Congratulations, Enter OTP ${opt} for Carrom Rivals KYC and you are one step away from winning real cash.`;
      break;
    case partner === 'BP':
      message = `Enter OTP ${opt} for BigPesa KYC and You are one step away from winning real cash!! Click https://bigpesa.in to earn real cash.`;
      break;
    case partner === 'NW':
      message = `Congratulations! Enter OTP ${opt} for WCC Rivals Cash Tournaments KYC and you are one step away from winning real cash!!`;
      break;
  }
  return message;
}

function firstTimeUserMessage() {
  let partner = config.partner;
  logger.info('partner in config file: ', partner);
  let message = '';
  switch(true) {
    case partner === 'BP':
      message = `Congratulations!! You have unlocked exciting prizes, claim them!!! Click https://bigpesa.in to earn real cash.`;
      break;
    case partner === 'NW':
      message = `Congratulations!! Your reward balance has been credited, claim them!`;
      break;
    case partner === 'CR':
      message = `Congratulations!! You have unlocked exciting prizes, claim them!!! Click https://carromclash.com to earn real cash.`;
      break;
  }
  return message;
}

function toCamelCase(string) {
  return string.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      // .replace('-', '')
      .replace('_', '');
  });
}

function toCamelCaseKeys(obj) {
  let camelCaseObj = {};
  for (let property in obj) {
    let camelCaseKey = toCamelCase(property);
    camelCaseObj[camelCaseKey] = obj[property];
  }
  return camelCaseObj;
}

module.exports = {
  randomNumber,
  generateOtpMessage,
  firstTimeUserMessage,
  toCamelCaseKeys
};
