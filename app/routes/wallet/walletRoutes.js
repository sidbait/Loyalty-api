var walletRoutes = express.Router();

var walletController = require('../../controller/wallet/walletController');

walletRoutes.post('/walletTransaction', walletController.walletTransaction);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = walletRoutes;