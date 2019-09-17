const config = require('config');
const logger = require('tracer').colorConsole();
const jwt = require('jsonwebtoken');
const pgConnection = require('../model/pgConnection');

const services = require('../service/service.js');

module.exports = {

    validateAccessToken: async (req, res, next) => {

        let rules = {
            "access-token": 'required',
        };

        let custom_message = {
            "required.access-token": "Please provide the Access Token!",
        }

        let validation = new services.validator(req.headers, rules, custom_message);

        if (validation.passes()) {

            var accessToken = req.headers["access-token"] ? req.headers["access-token"] : {};

            jwt.verify(accessToken, config.jwt_sessions.private_key,
                function (err, decoded) {
                    if (err) {

                        services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "INVALID_ACCESS_TOKEN");
                    } else {

                        req.userDetails = decoded.data.identity;
                        console.log('playerId ==> ', req.userDetails.playerId);
                        console.log('appId ==> ', req.userDetails.appId);
                        return next();
                    }
                });
        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    },

    validateAppSecret: async (req, res, next) => {

        let rules = {
            "x-naz-app-key": 'required',
        };

        let custom_message = {
            "required.x-naz-app-key": "Please provide the App Key!",
        }

        let validation = new services.validator(req.headers, rules, custom_message);

        if (validation.passes()) {

            var appKey = req.headers["x-naz-app-key"] ? req.headers["x-naz-app-key"] : '';

            let _query = {
                text: `SELECT * FROM fn_validate_appkey($1)`,
                values: [appKey]
            }

            let dbResult
            try {
                dbResult = await pgConnection.executeQuery('loyalty', _query);

            } catch (error) {
                dbResult = null
            }

            if (dbResult && dbResult[0].p_out_app_count) {
                req.appId = dbResult[0].p_out_app_count;
                return next();
            } else {
                services.sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "INVALID_APP_SECRET_KEY");
            }


        }
        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, "COMMON_MESSAGE", "VALIDATION_FAILED");
        }
    }
}

module.exports.validateAppSecretRmg = async (req, res, next) => {
    try {
      let key = req.headers['x-nazara-app-secret-key'];
      const app = await appCtrl.getAppBySecretKey(key);
      logger.info(app);
      if (app && app.app_id) {
        res.locals.app = app;
        return next();
      } else {
        // return next(err);
        throw({statusCode: 401, message: `Invalid app secret key.`});
      }
  
    } catch (err) {
      // return err;
      // return next(err);
      logger.error(err);
      res.status(err.statusCode).send({
        success: false,
        message: err.message,
        data: ''
      });
    }
  };
  
  module.exports.validateAccessToken = async (req, res, next) => {
    try {
      logger.info('validate access token for a player.');
      // logger.debug('header: ', req.headers);
      let token = req.headers['authorization'] ? req.headers['authorization'] : '';
      logger.info('token passed:', token);
      if (!token || token == '') {
        throw({statusCode: 401, message: `Unauthorized`});
      }
      // logger.info('token passed:', typeof token);
      let sliceToken = token.slice(6);
      // decrypt access token send.
      let decryptToken = jwtToken.decryptAccessToken(sliceToken);
      logger.info('decrypt access token :', decryptToken);
      // decode access token send in headers.
      let decoded = jwtToken.decodeAccessToken(decryptToken);
      logger.info('decoded from access token:', decoded);
      if (decoded.data.PlayerId) {
        //TODO: verify player id by db call.
        res.locals.app.player_id = decoded.data.PlayerId;
        next();
      }
    } catch(err) {
      logger.error('error while validating access token: ', err);
      res.status(err.statusCode).send({
        success: false,
        message: err.message,
        data: ''
      });
    }
  };
