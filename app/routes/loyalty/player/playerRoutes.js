var playerRoutes = express.Router();

var playerController = require('../../../controller/loyalty/player/playerController');

playerRoutes.post('/walletBalance', playerController.getPlayerWalletBalance);
playerRoutes.post('/details', playerController.getDetails);
playerRoutes.post('/wonRewards', playerController.wonRewards);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = playerRoutes;