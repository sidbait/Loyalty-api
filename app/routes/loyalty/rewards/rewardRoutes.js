var rewardRoutes = express.Router();

var rewardController = require('../../../controller/loyalty/rewards/rewardController');

rewardRoutes.post('/getAll', rewardController.getAll);
rewardRoutes.post('/participate', rewardController.rewardParticipate);
rewardRoutes.post('/getWinner', rewardController.getWinner);
rewardRoutes.post('/getPurchasedTickets', rewardController.getPurchasedTickets);
rewardRoutes.post('/getWinnersHistory', rewardController.getWinnersHistory);
rewardRoutes.post('/claimRewards', rewardController.claimRewards);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = rewardRoutes;