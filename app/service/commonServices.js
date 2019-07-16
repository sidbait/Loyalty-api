
const pgConnection = require('../model/pgConnection');

module.exports = {

    getAppId: async (appKey) => {

        return new Promise(async function (resolve, reject) {
            try {

                if (appKey) {
                    let _query = {
                        text: `SELECT app_id FROM tbl_app_master WHERE app_key = $1`,
                        values: [appKey]
                    }

                    let dbResult = await pgConnection.executeQuery('loyalty', _query);

                    console.log('getAppId', dbResult);


                    if (dbResult && dbResult.length > 0) {
                        resolve(dbResult[0].app_id);
                    }
                    else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },

    getPlayerIdByToken: async (token, appId) => {

        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT player_id FROM tbl_player_app WHERE nz_access_token = $1 and app_id = $2`,
                    values: [token, appId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getPlayerIdByToken', dbResult);

                if (dbResult && dbResult.length > 0) {
                    resolve(dbResult[0].player_id);
                }
                else {
                    resolve(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },

    getWalletBalance: async (playerId) => {

        return new Promise(async function (resolve, reject) {
            try {
                let _query = {
                    text: `SELECT np_balance FROM tbl_player_wallet WHERE player_id = $1`,
                    values: [playerId]
                }

                let dbResult = await pgConnection.executeQuery('loyalty', _query);

                console.log('getWalletBalance', dbResult);

                if (dbResult && dbResult.length > 0) {
                    resolve(dbResult[0].np_balance);
                }
                else {
                    reject(null);
                }

            } catch (error) {
                reject(error)
            }

        });

    },

    getTimeDiif: (dt1, dt2) => {
        var diff =(dt2.getTime() - dt1.getTime()) / 1000;
        // diff /= 60;
        return Math.abs(Math.round(diff));
    },

    randomString(length) {

        var text = "";
    
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
        for (var i = 0; i < length; i++) {
    
          text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        }
    
        return text;
      }

}