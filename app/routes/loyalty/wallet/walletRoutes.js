var walletRoutes = express.Router();

var walletController = require('../../../controller/loyalty/wallet/walletController');

walletRoutes.post('/walletTransaction', walletController.walletTransaction);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = walletRoutes;