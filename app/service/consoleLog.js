module.exports = {

    consoleDBLog: function (req, dbQuery, dbError, dbResult, timeToExecute) {

        if (config.debug_db_result) {

            let errorDesc = dbError ? dbError.toString() : '';

            console.log("-------------------------------------------------------\n" +
                'Log type: Data Base \n' +
                'route: ' + req.originalUrl + '\n' +
                'req.method: ' + req.method + '\n' +
                'app-secret-key: ' + req.headers["app-secret-key"] + '\n' +
                'access-token: ' + req.headers["access-token"] + '\n' +
                'req.query: ' + JSON.stringify(req.query) + '\n' +
                'req.body: ' + JSON.stringify(req.body) + '\n' +
                'req.params: ' + JSON.stringify(req.params) + '\n' +
                'req.userDetails: ' + JSON.stringify(req.userDetails) + '\n' +
                'db query: ' + JSON.stringify(dbQuery) + '\n' +
                'dbError: ' + JSON.stringify(dbError) + '\n' +
                'err desc: ' + errorDesc + '\n' +
                //'dbResult: ' + JSON.stringify(dbResult) + '\n' +
                'timeToExecute: ' + timeToExecute + '\n' +
                '-------------------------------------------------------\n');
        }
    },

    consoleCustomLog: function (req, err, customJSON) {

        //if (config.debug_db_result) {

        let errorDesc = err ? err.toString() : '';

        console.log("-------------------------------------------------------\n" +
            'Log type: Console \n' +
            'route: ' + req.originalUrl + '\n' +
            'req.method: ' + req.method + '\n' +
            'app-secret-key: ' + req.headers["app-secret-key"] + '\n' +
            'access-token: ' + req.headers["access-token"] + '\n' +
            'req.query: ' + JSON.stringify(req.query) + '\n' +
            'req.body: ' + JSON.stringify(req.body) + '\n' +
            'req.params: ' + JSON.stringify(req.params) + '\n' +
            'req.userDetails: ' + JSON.stringify(req.userDetails) + '\n' +
            'err: ' + JSON.stringify(err) + '\n' +
            'err desc: ' + errorDesc + '\n' +
            'customJSON: ' + JSON.stringify(customJSON) + '\n' +
            '-------------------------------------------------------\n');
        //}
    },

    consoleQueryExecution: function (dataBase, dbQuery, dbError, dbResult, timeToExecute) {


        if(timeToExecute.time > 2000){
            //Log Text File
        }

        if (config.debug_db_result) {

            let errorDesc = dbError ? dbError.toString() : '';

            console.log("-------------------------------------------------------\n" +
                'Log type: Execute Query\n' +
                'dataBase - '+dataBase+'\n'+
                'db query: ' + JSON.stringify(dbQuery) + '\n' +
                'dbError: ' + JSON.stringify(dbError) + '\n' +
                // 'err desc: ' + errorDesc + '\n' +
                'NODE_ENV: ' + process.env.NODE_ENV + '\n' +
                'dbResult: ' + JSON.stringify(dbResult) + '\n' +
                'timeToExecute: ' + timeToExecute.preciseWords + '\n' +
                '-------------------------------------------------------\n');
        }
    }
}