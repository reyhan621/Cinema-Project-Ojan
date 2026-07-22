const bcrypt = require("bcrypt");

const CODE_SALT_ROUNDS = 10;

// 6-digit numeric code the user types from their email.
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

// Codes are stored HASHED (like passwords): a leaked DB does not reveal live
// codes, and bcrypt makes offline brute-force infeasible within the 10-min window.
const hashCode = (code) => bcrypt.hash(String(code), CODE_SALT_ROUNDS);

const compareCode = async (code, hash) => {
  if (!hash) return false;
  return bcrypt.compare(String(code), hash);
};

const codeExpiry = (minutes = 10) => new Date(Date.now() + minutes * 60 * 1000);

module.exports = { generateCode, hashCode, compareCode, codeExpiry };
