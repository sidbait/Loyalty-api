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
        return new Promise(function (resolve, reject) {
            if (isRedis) {
                client.get(key, function (err, reply) {
                    if (err) {
                        reject(err);
                    }
                    if (reply) {
                        console.log('key : ', key);
                        console.log('Reply : ', JSON.stringify(reply));


                        try {
                            reply = JSON.parse(reply)

                            console.log(reply);
                            
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


        console.log(key)
        return new Promise(function (resolve, reject) {
            if (isRedis) {
                let newVal = JSON.stringify(val);
                client.set(key, newVal, redis.print);
                client.expire(key, expiretime) //  in sec
                resolve(redis.print);
            } else {
                reject('err');
            }
        });
    }
}