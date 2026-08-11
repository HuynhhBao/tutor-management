const crypto = require('crypto');
const querystring = require('qs');

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj){
    if (obj.hasOwnProperty(key)) {
    str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const reqQuery = {
  vnp_Amount: '50000000',
  vnp_BankCode: 'NCB',
  vnp_BankTranNo: 'VNP14532677',
  vnp_CardType: 'ATM',
  vnp_OrderInfo: 'Nap tien cho tai khoan 2',
  vnp_PayDate: '20260811174008',
  vnp_ResponseCode: '00',
  vnp_TmnCode: 'CGXZLS0Z',
  vnp_TransactionNo: '14532677',
  vnp_TransactionStatus: '00',
  vnp_TxnRef: 'VNPAY_1786469808_2',
  vnp_SecureHash: 'c4e3b1c...' // doesn't matter
};

let vnp_Params = { ...reqQuery };
delete vnp_Params['vnp_SecureHash'];
delete vnp_Params['vnp_SecureHashType'];

vnp_Params = sortObject(vnp_Params);
const secretKey = 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN';
const signData = querystring.stringify(vnp_Params, { encode: false });
const hmac = crypto.createHmac('sha512', secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

console.log('signData:', signData);
console.log('signed:', signed);
