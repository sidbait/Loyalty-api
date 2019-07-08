﻿const pg = require('pg');

const config = require('config');
const perf = require('execution-time')();

const consoleLog = require('../service/consoleLog.js');

const redis = require('./redisConnection');

const pool_loyalty = new pg.Pool(config.db_connectionString.pg.pg_loyalty);

module.exports = {

    executeQuery: function (dataBase, dbQuery, isRedis = false, expiretime = 0, isReadOnly = false) {

        perf.start();

        return new Promise(function (resolve, reject) {
            if (isRedis) {
                redis.GetRedis(dbQuery).then(redisResult => {
                    console.log('getting value from redis');
                    resolve(redisResult);
                }).catch(async x => {
                    executeQuery_db(dataBase, dbQuery, isReadOnly, function (dbError, dbResult) {

                        let timeToExecute = perf.stop();

                        consoleLog.consoleQueryExecution(dataBase, dbQuery, dbError, dbResult, timeToExecute);

                        if (dbError) {
                            reject(dbError)
                        } else {
                            redis.SetRedis(dbQuery, dbResult, expiretime)
                                .then(x => console.log('value set in redis'))
                                .catch(x => console.log('error while setting value in redis'))
                            resolve(dbResult);
                        }
                    });
                });
            } else {
                executeQuery_db(dataBase, dbQuery, isReadOnly, function (dbError, dbResult) {

                    let timeToExecute = perf.stop();

                    consoleLog.consoleQueryExecution(dataBase, dbQuery, dbError, dbResult, timeToExecute);

                    if (dbError) {
                        reject(dbError)
                    } else {
                        resolve(dbResult);
                    }
                });
            }
        })
    },
}

function executeQuery_db(dataBase, dbQuery, isReadOnly, callback) {

    var pool = null;

    if (dataBase == "loyalty")
        pool = pool_loyalty;

    if (pool == null) {
        callback("DB Pool details not available for dataBase - " + dataBase, null);
    }
    else {
        pool.connect(function (connectError, client, done) {

            done();

            if (connectError) {
                callback(connectError, null);
            }
            else {
                client.query(dbQuery, function (dbError, dbResult) {

                    if (dbError) {
                        callback(dbError, null);
                    }
                    else if (!dbResult) {
                        callback(err, null);
                    } else {
                        callback(null, dbResult.rows);
                    }
                });
            }
        });
    }
}
