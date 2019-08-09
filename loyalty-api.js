var cors = require('cors');
var morgan = require('morgan');
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

express = require('express');
bodyParser = require('body-parser');

path = require('path');
multer = require('multer');
io = require('socket.io').listen(4444);
var socketFunctions = require('./app/service/socketFunction');
io.set('origins', '*:*');
io.on('connection', function(socket){
    console.log('a user connected');
});
//code require
config = require('config');
router = require('./app/routes');
app = express();
app.use(cors());


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//multer setup
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        //console.log('filename:' + JSON.stringify(file));
        var tmp_file;
        var extension = file.mimetype;
        extension = extension.split('/');
        extension = extension[1];
        tmp_file = Date.now() + "." + extension;
        cb(null, tmp_file);
    }
});

app.use(multer({
    dest: './public/uploads/',
    storage: storage,
    fileFilter: function (req, file, cb) {
        cb(null, true);
    }
}).any());

app.use(function (req, res, next) {
    if (typeof req.files == "undefined") {
        req.files = [];
    }
    for (var i = 0; i < req.files.length; i++) {
        req[req.files[i]['fieldname']] = {};
        req[req.files[i]['fieldname']] = req.files[i];
    }
    // Pass to next layer of middleware
    next();
});
//multer setup

// app.use(function (req, res, next) {

//     console.log(
//         'Log type: Req Time \n' +
//         'route: ' + req.originalUrl + '\n' +
//         'req.method: ' + req.method + '\n' +
//         'app-secret-key: ' + req.headers["app-secret-key"] + '\n' +
//         'access-token: ' + req.headers["access-token"] + '\n' +
//         'req.query: ' + JSON.stringify(req.query) + '\n' +
//         'req.body: ' + JSON.stringify(req.body) + '\n' +
//         'req.params: ' + JSON.stringify(req.params) + '\n' +
//         'req.userDetails: ' + JSON.stringify(req.userDetails)
//     )

//     next();
//     }
// )
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
app.use('/v1/ngs', router);

//Setting max listeners to infinite.
process.setMaxListeners(0);
process.on('uncaughtException', function (err) {
    console.log('uncaughtException:', err.message);
    console.log(err.stack);
});

MongoClient.connect(config.db_connectionString.mongo.centralizeddb, { useNewUrlParser: true }, function (err, client) {
    if (!err) {
        // centralizeddb system
        app.set('mongodb', client.db('centralizeddb'));
        assert.equal(null, err);
        console.log("Mongo DB Instance Connected Succesfully.");
        app.listen(config.app.port, function () {

            console.log('Listening on port:' + config.app.port);
            console.log('Welcome to LOYALTY API');
            console.log('NODE_ENV', process.env.NODE_ENV);
            socketFunctions.sendSockets(io); 
        });
    }
});
