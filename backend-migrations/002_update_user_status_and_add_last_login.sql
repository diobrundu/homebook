-- Migration: Update users.status to membership status and add last_login_time
-- Date: 2025-12-02
-- Description: 
--   1. Change status enum from (active, inactive, pending) to (non_member, member, super_member)
--   2. Add last_login_time field to track user login for daily visitor statistics

SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Add last_login_time column
ALTER TABLE `users`
  ADD COLUMN `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间' AFTER `updated_at`;

-- Step 2: Update existing status values to new membership status
-- Map old values to new values:
-- 'active' -> 'member' (默认转为会员)
-- 'inactive' -> 'non_member' (非活跃转为非会员)
-- 'pending' -> 'non_member' (待审核转为非会员)
UPDATE `users` 
SET `status` = CASE 
  WHEN `status` = 'active' THEN 'member'
  WHEN `status` = 'inactive' THEN 'non_member'
  WHEN `status` = 'pending' THEN 'non_member'
  ELSE 'non_member'
END;

-- Step 3: Modify status enum to new membership values
ALTER TABLE `users` 
  MODIFY COLUMN `status` enum('non_member','member','super_member') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci 
  NOT NULL DEFAULT 'non_member' 
  COMMENT '会员状态：non_member=非会员, member=会员, super_member=超级会员';

SET FOREIGN_KEY_CHECKS = 1;

-- Verification query
-- SELECT id, username, status, last_login_time FROM users LIMIT 10;

