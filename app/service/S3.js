const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('config');

AWS.config.update(config.s3_auth);

const s3 = new AWS.S3();

const myBucket = 'static.bigpesa.in';

module.exports = {


    upload: async function (req, s3path, returnName = false) {

        return new Promise((resolve, reject) => {

            let object = req.files;

            for (const key in object) {

                if (object.hasOwnProperty(key)) {

                    const element = object[key];

                    let fromPath = element.destination + element.filename;

                    let utc = new Date().toJSON().slice(0, 10);

                    // let s3path = `admin/uploads/${utc}/${Date.now()}_${element.originalname}`;

                    let s3key = s3path ? `${s3path}/${element.originalname}` : `admin/uploads/${utc}/${Date.now()}_${element.originalname}`;

                    let extension = path.extname(fromPath)

                    if (extension.toLowerCase() == ".jpg" ||
                        extension.toLowerCase() == ".jpeg" ||
                        extension.toLowerCase() == ".png" ||
                        extension.toLowerCase() == ".gif") {

                        fs.readFile(fromPath, function (err, data) {
                            if (err) { throw err; }

                            params = { Bucket: myBucket, Key: s3key, Body: data, ACL: 'public-read' };

                            s3.upload(params, function (err, data) {

                                if (err) {
                                    reject(err)
                                    console.log(err)

                                } else {
                                    if (returnName) {
                                        resolve(data)
                                    } else {
                                        // resolve(data.Location)
                                        resolve('http://' + data.Bucket + '/' + data.key);
                                    }

                                    console.log("Successfully uploaded");
                                    console.log('http://' + data.Bucket + '/' + data.key);

                                }

                            });

                        });
                    }
                    else
                        reject("error - Invalid File Format")
                }
                else
                    reject("error - hasOwnProperty error")
            }
        });
    },

    multiUpload: async function (req, s3Folder) {

        return new Promise(async (resolve, reject) => {

            Promise.all(req.files.map(async element => {

                let fromPath = element.destination + element.filename;
                let s3key = `${s3Folder}/${element.originalname}`;

                let stream = fs.createReadStream(fromPath);
                let params = { Bucket: myBucket, Key: s3key, Body: stream, ACL: 'public-read' };

                try {
                    data = await s3.upload(params).promise();
                    return { url: 'http://' + data.Bucket + '/' + data.key, fieldname: element.fieldname };
                } catch (error) {
                    return handleError(err);
                }

            })).then((results) => {

                resolve(results);

            }).catch(err => reject(err))

        });
    },

    removeFromS3: (Bucket, Key) => {
        return new Promise(async (resolve, reject) => {
            const params = {
                Bucket: Bucket,
                Key: Key //if any sub folder-> path/of/the/folder.ext
            }
            try {
                await s3.headObject(params).promise()
                console.log("File Found in S3")
                try {
                    await s3.deleteObject(params).promise()
                    console.log("file deleted Successfully")
                    resolve(200)
                }
                catch (err) {
                    console.log("ERROR in file Deleting : " + JSON.stringify(err))
                    resolve(500)
                }
            } catch (err) {
                console.log("File not Found ERROR : " + err.code)
                resolve(404)
            }
        });
    },

    listObjects: (bucketname, s3Folder) => {
        return new Promise(async (resolve, reject) => {

            const params = {
                Bucket: bucketname,
                Delimiter: '/',
                Prefix: s3Folder + '/'
            };

            // console.log(params);

            try {
                const data = await s3.listObjectsV2(params).promise();
                resolve(data)
            } catch (err) {
                console.log("xxxxxxxxxxxxxxxx : " + err.code)
                reject(err)
            }
        });
    },

    listAllKeys: (bucketname) => {

        const listAllKeys = (params, out = []) => new Promise((resolve, reject) => {
            s3.listObjectsV2(params).promise()
                .then(({ Contents, IsTruncated, NextContinuationToken }) => {
                    out.push(...Contents);
                    !IsTruncated ? resolve(out) : resolve(listAllKeys(Object.assign(params, { ContinuationToken: NextContinuationToken }), out));
                })
                .catch(reject);
        });

        listAllKeys({ Bucket: bucketname })
            .then(console.log)
            .catch(console.log);
    }

}