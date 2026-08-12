const http = require('http');

const query = 'vnp_Amount=50000000&vnp_BankCode=NCB&vnp_BankTranNo=VNP14532677&vnp_CardType=ATM&vnp_OrderInfo=Nap+tien+cho+tai+khoan+2&vnp_PayDate=20260811174008&vnp_ResponseCode=00&vnp_TmnCode=CGXZLS0Z&vnp_TransactionNo=14532677&vnp_TransactionStatus=00&vnp_TxnRef=VNPAY_1786469808_2&vnp_SecureHash=1ad0a8924244dab0fef96e8af4b477648b790265b1eac7552c6e3ff9f925dfd6db991bf6812bf4caa3f2f45ff2d4e5e102d5cdce259b095a4f35faf5f41754d2';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/wallet/vnpay-return?' + query,
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY:', data));
});

req.on('error', (e) => console.error(e));
req.end();
