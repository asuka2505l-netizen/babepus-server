const { idParam } = require("./sharedValidators");

const notificationIdValidator = [idParam("id")];

module.exports = { notificationIdValidator };
