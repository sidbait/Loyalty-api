const pgConnection = require('../../model/pgConnection');
const services = require('../../service/service');

const customMsgType = "MASTER_MESSAGE";
const customMsgTypeCM = "COMMON_MESSAGE";

module.exports = {

    getAll: async function (req, res) {

        let _selectQuery = "SELECT * FROM tbl_role"
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
            // "role_id": 'required|numeric',
            "role_title": 'required',
            "role_name": 'required',
            "role_remark": 'required',
            "status": 'required|in:ACTIVE,DEACTIVE,PENDING',
        };

        let validation = new services.validator(req.body, rules);

        if (validation.passes()) {

            let _role_id = req.body.role_id ? req.body.role_id : null;
            let _role_title = req.body.role_title ? req.body.role_title : null;
            let _role_name = req.body.role_name ? req.body.role_name : null;
            let _role_remark = req.body.role_remark ? req.body.role_remark : null;
            let _status = req.body.status ? req.body.status : null;
            let _created_by = req.body.userid ? req.body.userid : null;
            let _updated_by = req.body.userid ? req.body.userid : null;

            let _query;
            let errMsgType = _role_id ? 'UPDATE_FAILED' : 'ADD_FAILED'
            let successMsgType = _role_id ? 'UPDATE_SUCCESS' : 'ADD_SUCCESS'

            if (!_role_id) {

                _query = {
                    text: "INSERT INTO tbl_role(role_title,role_name,role_remark,status,created_by,created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *",
                    values: [
                        _role_title, _role_name, _role_remark, _status, _created_by
                    ]
                }
            }
            else {

                _query = {
                    text: "UPDATE tbl_role SET role_id=$1,role_title=$2,role_name=$3,role_remark=$4,status=$5,updated_by=$6,updated_at=now() WHERE role_id=$7 RETURNING *",
                    values: [
                        _role_id, _role_title, _role_name, _role_remark, _status, _updated_by, _role_id
                    ]
                }

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
        let _role_id = req.body.role_id ? req.body.role_id : null;
        let _role_title = req.body.role_title ? req.body.role_title : null;
        let _role_name = req.body.role_name ? req.body.role_name : null;
        let _role_remark = req.body.role_remark ? req.body.role_remark : null;
        let _role_status = req.body.role_status ? req.body.role_status : null;

        let _selectQuery = 'SELECT * FROM tbl_role WHERE  1=1'

        if (_role_id) {
            _selectQuery += " AND role_id = " + _role_id
        }
        if (_role_title) {
            _selectQuery += " AND role_title = " + _role_title
        }
        if (_role_name) {
            _selectQuery += " AND role_name = " + _role_name
        }
        if (_role_remark) {
            _selectQuery += " AND role_remark = " + _role_remark
        }
        if (_role_status) {
            _selectQuery += " AND role_status = " + _role_status
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