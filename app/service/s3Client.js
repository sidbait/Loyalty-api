const AWS = require('aws-sdk');
const config = require('config');
const fs = require('fs');
const logger = require('tracer').colorConsole();

AWS.config.update(config.s3_auth);
const s3 = new AWS.S3();

const upload = async (filePath, originalname) => {
  try {
    // let filePath = '';
    logger.info('file path: ', filePath);
    let stream = fs.createReadStream(filePath);
    let keyValue = createCompletePath(originalname, 'player', '');
    let params = {
      Bucket: config.s3.bucket,
      Body: stream,
      // Key: `${originalname}`,
      Key: `${keyValue}`,
      ACL: 'public-read' 
    };
    let data = await s3.upload(params).promise();
    logger.info('image uploaded to s3 successfully: ', data);
    // return `http://${data.Bucket}/${data.Key}`;
    return {
      url: `http://${data.Bucket}/${data.Key}`,
      completePath: keyValue
    };
  } catch(err) {
    throw(err);
  }
};

const createCompletePath = (imageName, controllerName, gatewayName) => {
  let date = new Date();
  let completePath = '';
  let day = date.getDate();
  let month = date.getMonth();
  // let monthFormat = 0;
  if (month < 10) {
    month = ('0' + month).slice(-2);
  }
  if (date < 10) {
    date = ('0' + date).slice(-2);
  }
  let year = date.getFullYear();

  completePath = `${gatewayName}/${controllerName}/${year}/${month}/${day}/${Date.now()}${imageName}`;
  logger.info('complete generated s3 path: ', completePath);
  return completePath;
}

module.exports = {
  upload,
  createCompletePath
}
