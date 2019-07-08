const mailSender = require('../model/sendMail.js')
const pgConnection = require('../model/pgConnection.js')

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
//const fs = require('fs');

module.exports = {

    sendToQueue: function (userId, templateCode, mailData, attachment) {

        return new Promise(async function (resolve, reject) {

            try {

                let pgQuery = {
                    text: "select * from fn_addupdate_mailer_queue($1, $2, $3, $4, $5) ",
                    values: [
                        null,
                        userId,
                        templateCode,
                        JSON.stringify(mailData),
                        "PENDING"
                    ],
                }

                let dbResult = await pgConnection.executeQuery("cms", pgQuery);

                if (dbResult && dbResult.length > 0) {
                    resolve({
                        mailQueued: true,
                        mailQueueId: dbResult[0].fn_addupdate_mailer_queue,
                        message: "Mail Queued successfully!"
                    });
                }
                else {
                    resolve({
                        mailQueued: false,
                        mailQueueId: null,
                        message: "Mail Queue failed! Please try again."
                    });
                }
            }
            catch (error) {
                reject({
                    mailQueued: false,
                    mailQueueId: null,
                    message: error.toString()
                });
            };
        });
    },

    processMailerQueue: async function () {

        let pgQuery = {
            text: "select * from fn_get_mailerqueue()"
        }

        try {

            let dbResult = await pgConnection.executeQuery("cms", pgQuery)

            if (dbResult && dbResult.length > 0) {

                let mailerQueue = dbResult[0].data;

                if (mailerQueue) {

                    for (var count = 0; count < mailerQueue.length; count++) {

                        let emailTemplateFile = __dirname + "/emailTemplates/" + mailerQueue[count].templatefile;
                        let htmlCode = await fs.readFileAsync(emailTemplateFile, 'utf8');

                        var parsedData = JSON.parse(mailerQueue[count].sendingdata);

                        let email_subject = mailerQueue[count].email_subject ? mailerQueue[count].email_subject : '';
                        let email_cc = mailerQueue[count].email_cc ? mailerQueue[count].email_cc : '';
                        let email_bcc = mailerQueue[count].email_bcc ? mailerQueue[count].email_bcc : '';
                        let mailBody = null;

                        if (email_cc && mailerQueue[count].email_cc)
                            email_cc = email_cc + ";" + mailerQueue[count].email_cc;

                        if (email_bcc && mailerQueue[count].email_bcc)
                            email_bcc = email_bcc + ";" + mailerQueue[count].email_bcc;

                        if (email_subject)
                            email_subject = replaceText(email_subject, parsedData);
                        if (htmlCode)
                            mailBody = replaceText(htmlCode, parsedData);

                            var mailResponse, mailError;
                        if (mailBody) {

                            try {
                                mailResponse = await mailSender.sendMail(
                                    mailerQueue[count].email_to,
                                    email_cc,
                                    email_bcc,
                                    email_subject,
                                    mailBody,
                                    null);

                                    updateQueue(mailerQueue[count].mailerqueueid, "EMAIL", mailBody, null, true, mailResponse)
                            }
                            catch (mailError) {
                                mailError = mailError;
                                console.log('mailError - ', mailError);
                            }
                        }

                        console.log("----------------Mailer Queue - Details---------------\n" +
                            "Date - " + new Date() + "\n" +
                            "count - " + count + "\n" +
                            "mailerqueueid - " + mailerQueue[count].mailerqueueid + "\n" +
                            "userid - " + mailerQueue[count].userid + "\n" +
                            "templateid - " + mailerQueue[count].templateid + "\n" +
                            "sendingData - " + mailerQueue[count].sendingData + "\n" +
                            "templatecode - " + mailerQueue[count].templatecode + "\n" +
                            "templatefile - " + mailerQueue[count].templatefile + "\n" +
                            "sendtype - " + mailerQueue[count].sendtype + "\n" +
                            'mailResponse - ' + JSON.stringify(mailResponse) + '\n' +
                            'mailError - ' + JSON.stringify(mailError));
                    }
                }
                else {
                    console.log("Mailer Queue - Details are not available! | Date: " + new Date());
                }
            }
            else {
                console.log("Mailer Queue - Details are not available! | Date: " + new Date());
            }
        }
        catch (error) {
            console.log("Mailer Queue - Error : ", error);
        }
    }
}

function updateQueue(mailerQueueId, type, message, smsUrl, isSuccess, response) {

    var updateQuery = '';
    var status = "SUCCESS";

    if (isSuccess == false)
        status = "FAILED";

    var updateQuery = {
        text: "",
        values: null
    };

    if (type.toUpperCase() == "EMAIL") {
        response = JSON.stringify(response);
        updateQuery = {
            text: "update tbl_mailer_queue " +
                "set status = $1, email_response = $2 " +
                "where mailerqueueid = $3",
            values: [
                status,
                response,
                mailerQueueId
            ]
        }
    }
    if (type.toUpperCase() == "SMS") {
        updateQuery = {
            text: "update tbl_mailer_queue " +
                "set status = $1, sms_response = $2 " +
                "where mailerqueueid = $3",
            values: [
                status,
                response,
                mailerQueueId
            ]
        }
    }

    pgConnection.executeQuery("cms", updateQuery)
        .then(dbResult => {
            console.log("----------------Mailer Queue - Postgre Update Queue Details---------------\n" +
                "Date - " + new Date() + "\n" +
                "updateQuery" + JSON.stringify(updateQuery) + "\n" +
                "mailerqueueid - " + mailerQueueId + "\n" +
                "type - " + type + "\n" +
                "response - " + response + "\n" +
                "result - " + JSON.stringify(dbResult));
        })
        .catch(dbError => {
            console.log("----------------Mailer Queue - Postgre Update Queue Details---------------\n" +
            "Date - " + new Date() + "\n" +
            "updateQuery" + JSON.stringify(updateQuery) + "\n" +
            "mailerqueueid - " + mailerQueueId + "\n" +
            "type - " + type + "\n" +
            "response - " + response + "\n" +
            "dbError - " + JSON.stringify(dbError));
        })
}

function replaceText(text, mailData) {

    text = text.replace(/#Salutation/gi, mailData.salutation ? mailData.salutation : '')
        .replace(/#FirstName/gi, mailData.firstname ? mailData.firstname : '')
        .replace(/#MiddleName/gi, mailData.middlename ? mailData.middlename : '')
        .replace(/#LastName/gi, mailData.lastname ? mailData.lastname : '')
        .replace(/#EmailId/gi, mailData.emailid ? mailData.emailid : '')
        .replace(/#MobileNumber/gi, mailData.mobilenumber ? mailData.mobilenumber : '')
        .replace(/#SkypeId/gi, mailData.skypeid ? mailData.skypeid : '')
        .replace(/#UserId/gi, mailData.userid ? mailData.userid : '')
        .replace(/#VerifyCode/gi, mailData.verificationcode ? mailData.verificationcode : '')
        .replace(/#ConfirmCode/gi, mailData.resetpwdcode ? mailData.resetpwdcode : '')
        .replace(/#Password/gi, mailData.password ? mailData.password : '')

        .replace(/#AddressLine1/gi, mailData.addressline1 ? mailData.addressline1 : '')
        .replace(/#AddressLine2/gi, mailData.addressline2 ? mailData.addressline2 : '')
        .replace(/#Country/gi, mailData.country ? mailData.country : '')
        .replace(/#State/gi, mailData.state ? mailData.state : '')
        .replace(/#City/gi, mailData.city ? mailData.city : '')
        .replace(/#PinCode/gi, mailData.pincode ? mailData.pincode : '');

    return text;
}