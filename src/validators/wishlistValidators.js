const { idParam } = require("./sharedValidators");

const wishlistProductValidator = [idParam("productId")];

module.exports = { wishlistProductValidator };
