-- Migration: add price snapshot to appointments and add 'pending' to users.status
-- Run on MySQL. Test on staging before applying to production.

ALTER TABLE `appointments`
  ADD COLUMN `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '服务价格快照' AFTER `address`;

-- Modify users.status enum to include 'pending' (existing values preserved)
ALTER TABLE `users` MODIFY COLUMN `status` enum('active','inactive','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '账号状态';

-- Optional: add profile_picture and notification_preferences (JSON) to users
ALTER TABLE `users`
  ADD COLUMN `profile_picture` varchar(255) NULL DEFAULT NULL COMMENT '头像URL',
  ADD COLUMN `notification_preferences` json NULL COMMENT '通知偏好 JSON {"email":true,"push":false}';

-- If you prefer to keep enums strict, ensure application code migrates statuses appropriately
