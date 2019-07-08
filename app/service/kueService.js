const kue = require('kue');
const queue = kue.createQueue();
const pgConnection = require('../model/pgConnection');

module.exports = {

    processkue: function (kuename, callback) {

        queue.process(kuename, 5, async (job, done) => {

            if (job.data.type == 'executeQueryKue') {

                try {
                    let dbResult = await pgConnection.executeQuery('rmg_dev_db', job.data.query)

                    if (dbResult && dbResult.length > 0) {
                        done();
                        callback(true);
                    }
                    else {
                        job.failed();
                        done(new Error('err'));
                        callback(false);
                    }

                }
                catch (error) {
                    job.failed();
                    done(new Error(error));
                    callback(false);
                }
            } else {
                console.log('!= executeQueryKue');
                job.failed();
                done(new Error('bad'));
                callback(false);
            }
        });
    },

    createkue: function (kuename, data) {
        queue.create(kuename, data).priority('high').attempts(5).save();
    }

}