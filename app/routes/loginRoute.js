const loginRoute = express.Router();

var loginController = require('../controller/loginController');

loginRoute.post("/register", (req, res) => {
    loginController.register(req, res);
});

loginRoute.post("/verifyEmail", (req, res) => {
    loginController.verifyEmail(req, res);
});

loginRoute.post("/validateLogin", (req, res) => {
    loginController.validateLogin(req, res);
});

loginRoute.post("/forgotPassword", (req, res) => {
    loginController.forgotPassword(req, res);
});

loginRoute.post("/resetPassword", (req, res) => {
    loginController.resetPassword(req, res);
});

module.exports = loginRoute;