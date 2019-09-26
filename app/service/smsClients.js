const logger = require('tracer').colorConsole();
const config = require('config');
const request = require('request-promise');

async function publishMessage(message, phone, txnId, priority, partner) {
  try {
    let url, id, pwd, senderid, path = '';
    if (phone.startsWith('91')) {
      // http://203.115.112.8/CommonMTURLAllOperator/NextWVMtmd.aspx?id=ntwvmd&pwd=ntwvmd2105&msisdn=919940060452&senderid=WCCRVL&msg=hi
      if (partner == 'NW') {
        path = '/CommonMTURLAllOperator/NextWVMtmd.aspx';
        id = 'ntwvmd';
        pwd = 'ntwvmd2105';
        senderid = 'WCCRVL';
      } else {
        path = '/CommonMTURLAllOperator/Bigpesa.aspx';
        id = 'nazara';
        pwd = 'nazara063';
      }
      message = message.replace('#', '%23');
      message = message.replace('&', '%26');
      // url = `${config[partner].SMS_URL}${path}?id=${id}&pwd=${pwd}&msisdn=${phone}&senderid=${senderid}&msg=${message}`;
      let options = {
        method: 'GET',
        uri: `${config[partner].SMS_URL}${path}`,
        qs: {
          id: id,
          pwd: pwd,
          senderid: senderid,
          msisdn: phone,
          msg: message
        },
        json: true
      }
      return request(options);
    }
  } catch (err) {
    throw new Error(err);
  }
}

module.exports = {
  publishMessage
}
