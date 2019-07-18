module.exports = {

    mongoinsert: async (collection, insjson) => {
        var db = app.get('mongodb');
        var collection = db.collection(collection);
        return new Promise(async (resolve, reject) => {
            collection.insertMany([
                insjson
            ], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    console.log('mongo doc inserted :D');
                    
                    resolve(result)
                }
            });
        })

    },

    mongofind: async (collection, jsonwhr, lim) => {
        var db = app.get('mongodb');
        var collection = db.collection(collection);
        return new Promise(async (resolve, reject) => {
            if (lim == 0) {
                collection.find(jsonwhr).toArray(function (err, docs) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(docs)
                    }
                });
            } else {
                collection.find(jsonwhr).limit(lim).toArray(function (err, docs) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(docs)
                    }
                });
            }
        })
    },
}