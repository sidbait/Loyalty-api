var redis = require("redis"),
    client = redis.createClient();
isRedis = false;
client.on('error', err => {
    console.log(`redis ==>: ${err}`);
    isRedis = false;
});

client.on('connect', () => {
    console.log(`connected to redis`);
    isRedis = true;
});

module.exports = {
    GetRedis: function (key) {

        let KeyStr = JSON.stringify(key)
        return new Promise(function (resolve, reject) {
            if (isRedis) {
                client.get(KeyStr, function (err, reply) {
                    if (err) {
                        reject(err);
                    }
                    if (reply) {

                        try {
                            reply = JSON.parse(reply)

                        } catch (error) {
                            console.log(error);
                            reject(error);
                        }
                        resolve(reply);
                    } else {
                        reject('err');
                    }

                });
            } else {
                reject('err');
            }
        });
    },

    SetRedis: function (key, val, expiretime) {

        let KeyStr = JSON.stringify(key)

        return new Promise(function (resolve, reject) {
            if (isRedis) {
                let newVal = JSON.stringify(val);
                client.set(KeyStr, newVal, redis.print);
                client.expire(KeyStr, expiretime) //  in sec
                resolve(redis.print);
            } else {
                reject('err');
            }
        });
    }
}