const email_details = config.email_details;
const nodemailer = require('nodemailer');

module.exports = {

    sendMail: function (emailid_to, emailid_cc, emailid_bcc, subject, mailbody, attachment) {

        return new Promise(function (resolve, reject) {

            if (emailid_cc == '' || emailid_cc == null || emailid_cc == undefined)
                emailid_cc = null;
            if (emailid_bcc == '' || emailid_bcc == null || emailid_bcc == undefined)
                emailid_bcc = null;

            var mailOptions = mailOptions = {
                from: "Nazara CMS <automisedAPAC@nazara.com>",
                to: emailid_to,
                cc: emailid_cc,
                bcc: emailid_bcc,
                subject: subject,
                html: mailbody
            };

            let transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                secureConnection: false,
                auth: {
                    user: "automisedAPAC@nazara.com",
                    pass: "Nazar@123"
                },
                tls: {
                    ciphers: 'SSLv3'
                }
            });

            transporter.sendMail(mailOptions)
                .then(mailInfo => {

                    console.log('\n------------SEND EMAIL------------\n' +
                        "Subject: " + subject + "\n" +
                        "info: " + JSON.stringify(mailInfo) + "\n" +
                        "Email To: " + emailid_to + "\n" +
                        "Email CC: " + emailid_cc + "\n" +
                        "Email BCC: " + emailid_bcc + "\n");

                    resolve(mailInfo);

                }).catch(mailError => {

                    console.log('\n------------SEND EMAIL------------\n' +
                    "Subject: " + subject + "\n" +
                    "mailError:" + JSON.stringify(mailError) + "\n" +
                    "Email To: " + emailid_to + "\n" +
                    "Email CC: " + emailid_cc + "\n" +
                    "Email BCC: " + emailid_bcc + "\n");

                    reject(mailError)
                });
        })
    }
}