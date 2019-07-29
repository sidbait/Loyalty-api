var eventRoutes = express.Router();

var eventController = require('../../../controller/loyalty/event/eventController');

eventRoutes.post('/walletBalance', eventController.getPlayerWalletBalance);
eventRoutes.post('/details', eventController.getDetails);

module.exports = eventRoutes;