var walletRoutes = express.Router();

var walletController = require('../../controller/wallet/walletController');

walletRoutes.post('/walletTransaction', walletController.walletTransaction);
walletRoutes.post('/walletHistory', walletController.walletHistory);
//appRoutes.post('/getEvents', appController.getEvents);

module.exports = walletRoutes;