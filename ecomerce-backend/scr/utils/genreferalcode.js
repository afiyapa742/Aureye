const crypto = require('crypto');

// No 0/O/1/I so codes are easy to read and type
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(length = 6, prefix = 'AUR') {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}${code}`;
}

module.exports = generateReferralCode;