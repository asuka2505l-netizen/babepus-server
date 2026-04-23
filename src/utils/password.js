const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = (plainPassword, passwordHash) => bcrypt.compare(plainPassword, passwordHash);

module.exports = { comparePassword, hashPassword };
