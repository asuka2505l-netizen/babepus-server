const USER_ROLES = ["user", "admin"];
const PRODUCT_STATUSES = ["active", "sold", "archived"];
const OFFER_STATUSES = ["pending", "accepted", "rejected", "auto_rejected"];
const TRANSACTION_STATUSES = ["pending_meetup", "completed", "cancelled"];
const REPORT_STATUSES = ["pending", "reviewed", "resolved", "rejected"];
const REPORT_TARGETS = ["product", "user"];
const CONDITION_LABELS = ["like_new", "good", "fair", "needs_repair"];

module.exports = {
  CONDITION_LABELS,
  OFFER_STATUSES,
  PRODUCT_STATUSES,
  REPORT_STATUSES,
  REPORT_TARGETS,
  TRANSACTION_STATUSES,
  USER_ROLES
};
