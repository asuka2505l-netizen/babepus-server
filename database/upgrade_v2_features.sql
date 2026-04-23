USE babepus;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS faculty VARCHAR(120) NULL AFTER campus,
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL AFTER verification_status,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(120) NULL AFTER email_verified_at,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at DATETIME NULL AFTER email_verification_token,
  ADD INDEX IF NOT EXISTS idx_users_faculty (faculty),
  ADD INDEX IF NOT EXISTS idx_users_email_verification_token (email_verification_token);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS faculty VARCHAR(120) NULL AFTER campus_location,
  ADD INDEX IF NOT EXISTS idx_products_faculty_status (faculty, status);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS escrow_status ENUM('awaiting_payment', 'holding', 'released', 'refunded', 'disputed') NOT NULL DEFAULT 'holding' AFTER status,
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at DATETIME NULL AFTER escrow_status,
  ADD COLUMN IF NOT EXISTS seller_confirmed_at DATETIME NULL AFTER buyer_confirmed_at,
  ADD COLUMN IF NOT EXISTS payout_released_at DATETIME NULL AFTER seller_confirmed_at;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS communication_rating TINYINT UNSIGNED NULL AFTER rating,
  ADD COLUMN IF NOT EXISTS item_accuracy_rating TINYINT UNSIGNED NULL AFTER communication_rating,
  ADD COLUMN IF NOT EXISTS meetup_rating TINYINT UNSIGNED NULL AFTER item_accuracy_rating,
  ADD COLUMN IF NOT EXISTS tags JSON NULL AFTER meetup_rating,
  ADD COLUMN IF NOT EXISTS is_anonymous TINYINT(1) NOT NULL DEFAULT 0 AFTER tags;

CREATE TABLE IF NOT EXISTS wishlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wishlists_user_product (user_id, product_id),
  INDEX idx_wishlists_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(500) NOT NULL,
  action_url VARCHAR(255) NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, read_at, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  last_message_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conversations_product_buyer_seller (product_id, buyer_id, seller_id),
  INDEX idx_conversations_buyer (buyer_id, last_message_at),
  INDEX idx_conversations_seller (seller_id, last_message_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  body VARCHAR(2000) NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation_created (conversation_id, created_at),
  INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS escrow_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_escrow_events_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_escrow_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_escrow_events_transaction (transaction_id, created_at)
) ENGINE=InnoDB;
