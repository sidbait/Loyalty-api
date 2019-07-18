var rewController = require('../controller/loyalty/rewards/rewardController');
var results = [];
module.exports = {
    sendSockets: async function (io) {
        if (results == 0){
            rewController.getAllSocket(1, function (result) {
                results = result;
                console.log(results)
                results.forEach(element => {
                    
                });
            });
        }else{
            setTimeout(() => {
                this.sendSockets(io)
                //console.log('SEND');
                results.forEach(element => {
                    element.joins = parseInt(element.joins) + 2;
                });
                io.emit('message', { type: 'new-message', results: results });
            },5000);
        }  
    }
}