var checkReferralRoutes = express.Router();

var checkReferralController = require('../../controller/referral/checkReferralController');

checkReferralRoutes.get('/onRegistration', checkReferralController.onRegistration);

// checkReferralRoutes.post('/onGamePlay/', checkReferralController.onGamePlay);

// checkReferralRoutes.post('/onDeposit/', checkReferralController.onDeposit);
// get invite code
checkReferralRoutes.post('/getInviteCode', checkReferralController.getInviteCode);

checkReferralRoutes.post('/submitRefCode', checkReferralController.submitRefCode);

checkReferralRoutes.post('/claimEvent', checkReferralController.claimEvent);

module.exports = checkReferralRoutes;