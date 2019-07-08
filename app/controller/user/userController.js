const md5 = require('md5');
const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getAll: async function (req, res) {

        let _selectQuery = "SELECT * FROM tbl_user"
        try {
            let dbResult = await pgConnection.executeQuery('rmg_dev_db', _selectQuery)

            if (dbResult && dbResult.length > 0) {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_SUCCESS");
            }
            else
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
        }
        catch (error) {
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }
    },

    add: async function (req, res) {
        let rules = {
            // "user_id": 'required|numeric',
            "username": 'required',
            // "password": 'required',
            "email": 'required',
            "fullname": 'required',
            "status": 'required|in:ACTIVE,DEACTIVE,PENDING',
            "role_id": 'required|numeric',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _user_id = req.body.user_id ? req.body.user_id : null;
            let _username = req.body.username ? req.body.username : null;
            // let _password = req.body.password ? req.body.password : null;
            let _email = req.body.email ? req.body.email : null;
            let _fullname = req.body.fullname ? req.body.fullname : null;
            let _status = req.body.status ? req.body.status : null;
            let _role_id = req.body.role_id ? req.body.role_id : null;
            let _created_by = req.body.userid ? req.body.userid : null;
            let _updated_by = req.body.userid ? req.body.userid : null;

            // let _password_hash = md5(_password)

            let _query;
            let errMsgType = _user_id ? 'UPDATE_FAILED' : 'ADD_FAILED'
            let successMsgType = _user_id ? 'UPDATE_SUCCESS' : 'ADD_SUCCESS'

            let checkInDB = `select user_id from tbl_user where (email = '${_email}' or username = '${_username}')`

            if (!_user_id) {

                _query = {
                    text: "INSERT INTO tbl_user(username,email,fullname,status,role_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *",
                    values: [
                        _username, _email, _fullname, _status, _role_id, _created_by
                    ]
                }
            }
            else {

                _query = {
                    text: "UPDATE tbl_user SET user_id=$1,username=$2,email=$3,fullname=$4,status=$5,role_id=$6,updated_by=$7,updated_at=now() WHERE user_id=$8 RETURNING *",
                    values: [
                        _user_id, _username, _email, _fullname, _status, _role_id, _updated_by, _user_id
                    ]
                }

                checkInDB += " AND user_id != " + _user_id

            }

            try {

                let checkInDBResult = await pgConnection.executeQuery('rmg_dev_db', checkInDB)
                console.log(checkInDBResult);

                if (checkInDBResult && checkInDBResult.length > 0) {
                    services.sendResponse.sendWithCode(req, res, checkInDBResult[0], "LOGIN_MESSAGE", "USER_ALREADY_REGISTERD");
                }
                else {

                    let result = await pgConnection.executeQuery('rmg_dev_db', _query)


                    if (result.length > 0) {
                        services.sendResponse.sendWithCode(req, res, result[0], customMsgType, successMsgType);
                    } else {
                        services.sendResponse.sendWithCode(req, res, error, customMsgType, errMsgType);
                    }
                }
            }
            catch (error) {
                console.log(error);

                services.sendResponse.sendWithCode(req, res, error, customMsgType, errMsgType);
            }
        }

        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    changePassword: async function (req, res) {
        let rules = {
            "user_id": 'required|numeric',
            "password1": 'required',
            "password2": 'required',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _user_id = req.body.user_id ? req.body.user_id : null;
            let _password = req.body.password1 == req.body.password2 ? req.body.password1 : null;
            let _password_hash = md5(_password)

            let _updated_by = req.body.userid ? req.body.userid : null;

            let _query;
            let errMsgType = _user_id ? 'UPDATE_FAILED' : 'ADD_FAILED'
            let successMsgType = _user_id ? 'UPDATE_SUCCESS' : 'ADD_SUCCESS'

            _query = {
                text: "UPDATE tbl_user SET user_id=$1,password_hash=$2,updated_by=$3,updated_at=now() WHERE user_id=$4 RETURNING *",
                values: [
                    _user_id, _password_hash, _updated_by, _user_id
                ]
            }

            try {

                let result = await pgConnection.executeQuery('rmg_dev_db', _query)


                if (result.length > 0) {
                    services.sendResponse.sendWithCode(req, res, result[0], customMsgType, successMsgType);
                } else {
                    services.sendResponse.sendWithCode(req, res, error, customMsgType, errMsgType);
                }
            }
            catch (error) {

                services.sendResponse.sendWithCode(req, res, error, customMsgType, errMsgType);
            }
        }

        else {
            services.sendResponse.sendWithCode(req, res, validation.errors.errors, customMsgTypeCM, "VALIDATION_FAILED");

        }
    },

    search: async function (req, res) {
        let _user_id = req.body.user_id ? req.body.user_id : null;
        let _username = req.body.username ? req.body.username : null;
        let _email = req.body.email ? req.body.email : null;
        let _fullname = req.body.fullname ? req.body.fullname : null;
        let _status = req.body.status ? req.body.status : null;

        let _selectQuery = 'select * from tbl_user inner join tbl_role on tbl_role.role_id = tbl_user.role_id where 1=1'

        if (_user_id) {
            _selectQuery += " AND user_id = " + _user_id
        }
        if (_username) {
            _selectQuery += " AND username = " + _username
        }
        if (_email) {
            _selectQuery += " AND email = " + _email
        }
        if (_fullname) {
            _selectQuery += " AND fullname = " + _fullname
        }
        if (_status) {
            _selectQuery += " AND status = " + _status
        }

        try {
            let dbResult = await pgConnection.executeQuery('rmg_dev_db', _selectQuery)

            if (dbResult && dbResult.length > 0) {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_SUCCESS");
            } else {
                services.sendResponse.sendWithCode(req, res, dbResult, customMsgType, "GET_FAILED");
            }
        }
        catch (error) {
            services.sendResponse.sendWithCode(req, res, error, customMsgTypeCM, "DB_ERROR");
        }
    }
}