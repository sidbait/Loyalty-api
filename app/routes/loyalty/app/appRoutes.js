var appRoutes = express.Router();

var appController = require('../../../controller/loyalty/app/appController');

appRoutes.post('/player-register', appController.register);
appRoutes.post('/getDetails', appController.getDetails);
appRoutes.post('/otpLogin', appController.otpLogin);
appRoutes.post('/otpVerify', appController.otpVerify);
appRoutes.post('/generateToken', appController.generateToken);

module.exports = appRoutes;