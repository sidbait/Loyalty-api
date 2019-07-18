
//require('rootpath')();
//require('express-group-routes');
const middleware = require('express-inject-middleware');

const app = express();
const sendResponse = require('../service/sendResponse');
const validate = require('../auth/validate');

const apiRoutes = express.Router();
const apiRoutes_player = express.Router();
const apiRoutes_login = express.Router();

//Module Wise Routes
const appRoutes = require('../routes/loyalty/app/appRoutes');
const walletRoutes = require('../routes/loyalty/wallet/walletRoutes');
const playerRoutes = require('../routes/loyalty/player/playerRoutes');
const checkReferralRoutes = require('../routes/referral/checkReferralRoutes');

const rewardRoutes = require('../routes/loyalty/rewards/rewardRoutes');

apiRoutes.get('/', function (req, res) {
    sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "WELCOME");
});

app.use(middleware.injectMiddleware(
    [
        // validate.validateAppSecret,
        // validate.validateAccessToken,
    ],
    [
        apiRoutes_player.use('/wallet', walletRoutes),
        apiRoutes_login.use('/player', playerRoutes),
        apiRoutes_login.use('/rewards', rewardRoutes),
        apiRoutes_player.use('/checkReferral', checkReferralRoutes)
    ]
));


app.use(middleware.injectMiddleware(
    [
        validate.validateAppSecret
    ],
    [
        apiRoutes_login.use('/app', appRoutes)
    ]
));



app.use(apiRoutes)
app.use(apiRoutes_login)
app.use(apiRoutes_player)

module.exports = app;

