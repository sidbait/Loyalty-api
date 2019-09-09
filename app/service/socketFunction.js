var rewController = require('../controller/loyalty/rewards/rewardController');
var results = [];
const logger = require('tracer').colorConsole();
module.exports = {
    sendSockets: async function (io) {

        rewController.getAllSocket(1, function (result) {
            results = result;
            /*  console.log('Socket Result======================')
           console.log(results) */
            io.emit('message', { type: 'new-message', results: results });

        });
        setTimeout(() => {
            this.sendSockets(io);
        }, 5000);

    }
}