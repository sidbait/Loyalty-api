var eventRoutes = express.Router();

var eventController = require('../../../controller/loyalty/event/eventController');

eventRoutes.post('/getAll', eventController.getEvents);
eventRoutes.post('/claimEvent', eventController.claimEvent);

module.exports = eventRoutes;