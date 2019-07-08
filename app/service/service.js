var services = {
   validator: require('validatorjs'),
   sendResponse: require('./sendResponse.js'),
   validateCheckSum: require('./validateCheckSum.js'),
   consoleLog: require('./consoleLog.js'),
   customMessage: require('./customMessage.js'),
   sendMail: require('./sendMail.js'),
   s3: require('./S3'),
   kue: require('./kueService'),
   commonServices: require('./commonServices'),
};

module.exports = services;