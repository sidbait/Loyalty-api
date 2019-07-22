var rewController = require('../controller/loyalty/rewards/rewardController');
var results = [];
module.exports = {
    sendSockets: async function (io) {
        
            rewController.getAllSocket(1, function (result) {
                results = result;
                console.log('Socket Result======================')
              console.log(results)
                io.emit('message', { type: 'new-message', results: results });
                /* results.forEach(element => {
                     
                }); */
            });
            setTimeout(() => {
                this.sendSockets(io);
            },5000);
       /*  }else{
            setTimeout(() => {
                this.sendSockets(io)
                //console.log('SEND');
                results.forEach(element => {
                    element.joins = parseInt(element.joins) + 2;
                });
                io.emit('message', { type: 'new-message', results: results });
            },5000);
        }   */
    }
}