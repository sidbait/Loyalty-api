var dateformat = require('dateformat');
var md5 = require('md5');
var sha512 = require('js-sha512');

module.exports = {

    validate: function (md5Checksum, apiChecksum, userToken) {
        
        var now = new Date();

        md5Checksum = md5(md5Checksum) + '|' +
            md5(config.app.app_key + '$'+ userToken) + '|' +
            md5(dateformat(now, 'yyyy-mm-dd'));

        var sha512Checksum = sha512(md5Checksum);

        console.log('sha512Checksum',sha512Checksum);
        

        if (sha512Checksum === apiChecksum) {
            return true;
        }

        return false;
    },
    validateLogin: function (md5Checksum, apiChecksum) {
        
        var now = new Date();

        md5Checksum = md5(md5Checksum) + '|' +
            md5(config.app.app_key) + '|' +
            md5(dateformat(now, 'yyyy-mm-dd'));

        var sha512Checksum = sha512(md5Checksum);

        console.log('sha512Checksum',sha512Checksum);
        

        if (sha512Checksum === apiChecksum) {
            return true;
        }

        return false;
    }
}