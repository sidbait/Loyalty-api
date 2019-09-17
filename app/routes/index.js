
//require('rootpath')();
//require('express-group-routes');
const middleware = require('express-inject-middleware');

const app = express();
const sendResponse = require('../service/sendResponse');
const validate = require('../auth/validate');

const apiRoutes = express.Router();
const apiRoutes_player = express.Router();
const apiRoutes_login = express.Router();

const apiRoutes_rmg = express.Router();

//Module Wise Routes
const appRoutes = require('../routes/loyalty/app/appRoutes');
const walletRoutes = require('../routes/loyalty/wallet/walletRoutes');
const playerRoutes = require('../routes/loyalty/player/playerRoutes');
const rewardRoutes = require('../routes/loyalty/rewards/rewardRoutes');
const goodsRoutes = require('../routes/loyalty/goods/goodsRoute');
const eventRoutes = require('../routes/loyalty/event/eventRoutes');
const checkReferralRoutes = require('../routes/referral/checkReferralRoutes');

// rmg wallet routes
const walletRmgRoutes = require('../routes/rmg/walletRoutes');

/* var io = require('socket.io').listen(4444); */
var socketFunctions = require('../service/socketFunction');
/* io.set('origins', '*:*');
io.on('connection', function(socket){
    console.log('a user connected');
});
 */
apiRoutes.get('/', function (req, res) {
    sendResponse.sendWithCode(req, res, null, "COMMON_MESSAGE", "WELCOME");
});
apiRoutes.get('/sendMsg', function (req, res) { 
    socketFunctions.sendSockets(io); 
    res.send('ok');
});

app.use(middleware.injectMiddleware(
    [
        validate.validateAppSecret,
        validate.validateAccessToken,
    ],
    [
        apiRoutes_player.use('/wallet', walletRoutes),
        apiRoutes_login.use('/player', playerRoutes),
        apiRoutes_login.use('/rewards', rewardRoutes),
        apiRoutes_login.use('/goods', goodsRoutes),
        apiRoutes_login.use('/event', eventRoutes),
        apiRoutes_player.use('/checkReferral', checkReferralRoutes),
        apiRoutes_rmg.use('/wallet', walletRmgRoutes)
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

