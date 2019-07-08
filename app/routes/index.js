
//require('rootpath')();
//require('express-group-routes');
const middleware = require('express-inject-middleware');

const app = express();
const sendResponse = require('../service/sendResponse');
const validate = require('../auth/validate');

const apiRoutes = express.Router();
const apiRoutes_player = express.Router();
const apiRoutes_login = express.Router();

//Login/Register Routes
const loginRoute = require('../routes/loginRoute');

//Module Wise Routes
const appRoutes = require('../routes/app/appRoutes');
const walletRoutes = require('../routes/wallet/walletRoutes');
const playerRoutes = require('../routes/player/playerRoutes');

apiRoutes.get('/', function (req, res) {
    sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "WELCOME");
});

app.use(middleware.injectMiddleware(
    [
        validate.validateAppSecret,
        validate.validateAccessToken,
    ],
    [
        apiRoutes_player.use('/wallet', walletRoutes),
        apiRoutes_login.use('/player', playerRoutes)
    ]
));


app.use(middleware.injectMiddleware(
    [
        validate.validateAppSecret
    ],
    [
        apiRoutes_login.use(loginRoute),
        apiRoutes_login.use('/app', appRoutes)
    ]
));



app.use(apiRoutes)
app.use(apiRoutes_login)
app.use(apiRoutes_player)

module.exports = app;

