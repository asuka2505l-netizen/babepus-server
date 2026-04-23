const { idParam } = require("./sharedValidators");

const completeTransactionValidator = [idParam("id")];

module.exports = { completeTransactionValidator };
