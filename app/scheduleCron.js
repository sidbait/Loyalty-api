const sendMail = require('./service/sendMail.js');

module.exports = {

    schedule: function () {

        setInterval(function () {
            sendMail.processMailerQueue();
        }, 30000);
        //15 Minutes
    }

}