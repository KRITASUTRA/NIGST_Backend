const crypto = require('crypto')


const generateNumericValue = (length) => {
  return parseInt(crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length), 16)
    .toString().padStart(length, '0');
};

module.exports=generateNumericValue