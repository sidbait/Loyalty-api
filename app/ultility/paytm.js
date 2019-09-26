var request = require('request-promise');
var config = require('config');
var logger = require('tracer').colorConsole();
var checksum = require('./checksum');


const checkStatusCallback = function (trxId, callback) {
  logger.trace('inside checkStatus callback fn');
  var merchantGuid = config.paytm.merchantGuid;
  var merchantkey = config.paytm.merchantkey;
  var salesWalletGuid = config.paytm.salesWalletGuid;
  var baseurl =config.paytm.url + '/wallet-web/checkStatus';
  //var url = "https://trust-uat.paytm.in/wallet-web/checkStatus";
  var samarray = new Array();
  samarray = {
      "request":
      {
          "requestType": "wallettxnid",
          "txnType": "SALES_TO_USER_CREDIT",
          "txnId": trxId,
          "merchantGuid": merchantGuid
      },
      "platformName": "PayTM",
      "operationType": "CHECK_TXN_STATUS"
  }
  console.log(baseurl)
  console.log(samarray)
  var finalstring = JSON.stringify(samarray); 
  
  checksum.genchecksumbystring(finalstring, merchantkey, function (err, result) {
    request({
        url: baseurl, //URL to hit
        //  qs: finalstring, //Query string data
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'mid': merchantGuid,
            'checksumhash': result
        },
        body: finalstring//Set the body as a string
    }, function (error, response, body) {
        if (error) {
            callback(true, error);

        } else {
            callback(false, body);
        }
    });
  });
};

const checkPaytmStatus = (orderId) => {
  return new Promise((resolve, reject) => {
    var paramarray = new Array();
    var PAYTM_MERCHANT_KEY = config.paytmDeposit.PAYTM_MERCHANT_KEY;// "RFJy_g5VuIIve&Cs";
    paramarray['MID'] = config.paytmDeposit.paramarray;// 'Nazara42624799846757';
    paramarray['ORDERID'] = orderId;

    console.log(paramarray);
    console.log(PAYTM_MERCHANT_KEY);
    checksum.genchecksum(paramarray, PAYTM_MERCHANT_KEY, function (err, result) {
      var data = { MID: result.MID, ORDERID: result.ORDERID, CHECKSUMHASH: result.CHECKSUMHASH };
      // console.log("Result ", data);
      // res.send("https://securegw-stage.paytm.in/merchant-status/getTxnStatus?JsonData="+ JSON.stringify(data))
      // res.send(config.paytmDeposit.url + JSON.stringify(data))
      const urlString = config.paytmDeposit.url + JSON.stringify(data);
      let options = {
        uri: urlString,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      };
      request(options)
        .then(result => {
          logger.info('result from paytm about status: ', result);
          return resolve(result);
        })
        .catch(err => {
          reject(err);
        })
    });
  });
};

const checkStatus = (trxId) => {
  return new Promise((resolve, reject) => {
    logger.trace('trxId passed: ', trxId);
    checkStatusCallback(trxId, function(err, resp) {
      if (err) {
        reject(err);
      } else {
        return resolve(resp);
      }
    });
  });
};
module.exports = {
  checkStatus,
  checkPaytmStatus
}