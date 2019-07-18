var services = {
   validator: require('validatorjs'),
   sendResponse: require('./sendResponse.js'),
   validateCheckSum: require('./validateCheckSum.js'),
   consoleLog: require('./consoleLog.js'),
   customMessage: require('./customMessage.js'),
   s3: require('./S3'),
   commonServices: require('./commonServices'),
};

module.exports = services;