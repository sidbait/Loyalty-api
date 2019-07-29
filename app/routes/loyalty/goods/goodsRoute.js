var goodsRoutes = express.Router();

var goodsController = require('../../../controller/loyalty/goods/goodsController');

goodsRoutes.post('/getAll', goodsController.getAll);
goodsRoutes.post('/buyGoods', goodsController.buyGoods);

module.exports = goodsRoutes;