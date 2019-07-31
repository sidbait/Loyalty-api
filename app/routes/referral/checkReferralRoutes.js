var checkReferralRoutes = express.Router();

var checkReferralController = require('../../controller/referral/checkReferralController');

checkReferralRoutes.get('/onRegistration', checkReferralController.onRegistration);

checkReferralRoutes.post('/getInviteCode', checkReferralController.getInviteCode);

checkReferralRoutes.post('/submitRefCode', checkReferralController.submitRefCode);

checkReferralRoutes.post('/claimEvent', checkReferralController.claimEvent);

checkReferralRoutes.post('/claimEventList', checkReferralController.claimEventList);

checkReferralRoutes.post('/amountEarned', checkReferralController.amountEarned);

checkReferralRoutes.post('/getReferralDetail', checkReferralController.getReferralDetail);

module.exports = checkReferralRoutes;