const logger = require('tracer').colorConsole();
const playerController = require('../playerController');
const s3Client = require('../../clients/s3Client');

const updatePlayer = async (app, playerObj, profileImage) => {
  try {
    logger.info('update player properties and if image pass update image.');
    // TODO: if profile image send, then upload to s3.
    logger.trace('app object: ', app);
    logger.trace('player object: ', playerObj);
    logger.trace('player profile image uploaded locally: ', profileImage);
    // Object.keys(req.file).length === 0 && req.file.constructor === Object
    let imageUrl = '';
    if (Object.keys(profileImage).length !== 0) {
      let path = `${profileImage.destination}/${profileImage.filename}`;
      let imageUploadS3 = await s3Client.upload(path, profileImage.originalname);
      logger.info('response from s3 upload: ', imageUploadS3);
      imageUrl = imageUploadS3.completePath;
    }
    let updatedPlayer = await playerController.updatePlayer(app.player_id, playerObj.device_id, app.app_id, app.app_name, playerObj.full_name, playerObj.first_name, playerObj.last_name, playerObj.email_id, playerObj.number, imageUrl, playerObj.facebook_id, playerObj.google_id, playerObj.truecaller_id, playerObj.dob, playerObj.city, playerObj.state, playerObj.country, playerObj.gender, playerObj.language);
    logger.info('player details updated successfully: ');
    return updatedPlayer;
  } catch(err) {
    throw(err);
  }
};

module.exports = {
  updatePlayer
};
