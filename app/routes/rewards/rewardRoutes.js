var rewardRoutes = express.Router();

var rewardController = require('../../controller/rewards/rewardController');

rewardRoutes.post('/getAll', rewardController.getAll);
rewardRoutes.post('/participate', rewardController.rewardParticipate);
rewardRoutes.post('/getWinner', rewardController.getWinner);
rewardRoutes.post('/getPurchasedTickets', rewardController.getPurchasedTickets);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = rewardRoutes;