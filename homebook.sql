/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80044
 Source Host           : localhost:3306
 Source Schema         : homebook

 Target Server Type    : MySQL
 Target Server Version : 80044
 File Encoding         : 65001

 Date: 28/11/2025 08:39:43
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for appointments
-- ----------------------------
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `customer_id` int NOT NULL COMMENT '预约客户ID',
  `provider_id` int NULL DEFAULT NULL COMMENT '服务人员ID',
  `service_id` int NOT NULL COMMENT '服务项目ID',
  `appointment_time` datetime NOT NULL COMMENT '预约时间',
  `duration_hours` decimal(4, 2) NOT NULL DEFAULT 1.00 COMMENT '服务时长(小时)',
  `price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '服务价格快照',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '服务地址',
  `status` enum('pending','accepted','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '预约状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `provider_id`(`provider_id` ASC) USING BTREE,
  INDEX `service_id`(`service_id` ASC) USING BTREE,
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家政服务预约表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of appointments
-- ----------------------------
INSERT INTO `appointments` VALUES (1, 1, 1, 1, '2025-12-01 10:00:00', 2.00, 200.00, '北京市朝阳区XX小区1号楼101室', 'completed', '2025-11-28 08:34:48', '2025-11-28 08:34:48');
INSERT INTO `appointments` VALUES (2, 2, 2, 3, '2025-12-02 15:00:00', 3.00, 240.00, '上海市浦东新区YY小区2号楼202室', 'completed', '2025-11-28 08:34:48', '2025-11-28 08:34:48');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `sender_id` int NOT NULL COMMENT '发送者ID',
  `receiver_id` int NOT NULL COMMENT '接收者ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sender_id`(`sender_id` ASC) USING BTREE,
  INDEX `receiver_id`(`receiver_id` ASC) USING BTREE,
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '消息表(客户与服务人员的沟通)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 1, 4, '您好，请问12月1日有空吗？', 0, '2025-11-28 08:34:48');
INSERT INTO `messages` VALUES (2, 4, 1, '您好，有时间，您需要什么服务？', 0, '2025-11-28 08:34:48');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `appointment_id` int NOT NULL COMMENT '预约ID',
  `order_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单编号',
  `amount` decimal(10, 2) NOT NULL COMMENT '订单金额',
  `payment_status` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '支付状态',
  `payment_method` enum('wechat','alipay','cash','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'wechat' COMMENT '支付方式',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_order_number`(`order_number` ASC) USING BTREE,
  UNIQUE INDEX `idx_appointment`(`appointment_id` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单表(包含支付信息)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, 1, 'ORD1001', 200.00, 'paid', 'wechat', '2025-11-28 08:34:48', '2025-11-28 08:34:48');
INSERT INTO `orders` VALUES (2, 2, 'ORD1002', 240.00, 'paid', 'alipay', '2025-11-28 08:34:48', '2025-11-28 08:34:48');

-- ----------------------------
-- Table structure for provider_availability
-- ----------------------------
DROP TABLE IF EXISTS `provider_availability`;
CREATE TABLE `provider_availability`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '可预约时间ID',
  `provider_id` int NOT NULL COMMENT '服务人员ID',
  `start_time` datetime NOT NULL COMMENT '可预约开始时间',
  `end_time` datetime NOT NULL COMMENT '可预约结束时间',
  `is_booked` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已被预约',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `provider_id`(`provider_id` ASC) USING BTREE,
  CONSTRAINT `provider_availability_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '服务人员可预约时间段' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of provider_availability
-- ----------------------------
INSERT INTO `provider_availability` VALUES (1, 1, '2025-12-01 09:00:00', '2025-12-01 12:00:00', 1);
INSERT INTO `provider_availability` VALUES (2, 1, '2025-12-02 09:00:00', '2025-12-02 12:00:00', 0);
INSERT INTO `provider_availability` VALUES (3, 2, '2025-12-02 14:00:00', '2025-12-02 18:00:00', 1);

-- ----------------------------
-- Table structure for provider_documents
-- ----------------------------
DROP TABLE IF EXISTS `provider_documents`;
CREATE TABLE `provider_documents`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '资质ID',
  `provider_id` int NOT NULL COMMENT '服务人员ID',
  `document_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '证件类型',
  `document_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '证件文件路径',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `reviewed_at` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `reviewer_id` int NULL DEFAULT NULL COMMENT '审核管理员ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `provider_id`(`provider_id` ASC) USING BTREE,
  INDEX `reviewer_id`(`reviewer_id` ASC) USING BTREE,
  CONSTRAINT `provider_documents_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `provider_documents_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '服务人员资质审核表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of provider_documents
-- ----------------------------
INSERT INTO `provider_documents` VALUES (1, 1, '身份证', '/docs/zhaoqiang_id.png', 'approved', '2025-11-20 08:00:00', '2025-11-21 09:30:00', 6);
INSERT INTO `provider_documents` VALUES (2, 2, '身份证', '/docs/zhoumin_id.png', 'pending', '2025-11-25 10:15:00', NULL, NULL);

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `appointment_id` int NOT NULL COMMENT '预约ID',
  `customer_id` int NOT NULL COMMENT '评价客户ID',
  `provider_id` int NOT NULL COMMENT '被评价服务人员ID',
  `rating` tinyint NOT NULL COMMENT '评分(1-5)',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '评价内容',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_appointment`(`appointment_id` ASC) USING BTREE,
  INDEX `provider_id`(`provider_id` ASC) USING BTREE,
  INDEX `customer_id`(`customer_id` ASC) USING BTREE,
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评价表(客户对服务人员的评分和评论)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reviews
-- ----------------------------
INSERT INTO `reviews` VALUES (1, 1, 1, 1, 5, '非常满意, 服务很专业!', '2025-11-28 08:34:48');
INSERT INTO `reviews` VALUES (2, 2, 2, 2, 4, '服务很好, 会推荐给朋友', '2025-11-28 08:34:48');

-- ----------------------------
-- Table structure for service_categories
-- ----------------------------
DROP TABLE IF EXISTS `service_categories`;
CREATE TABLE `service_categories`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '服务分类名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分类描述',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家政服务分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of service_categories
-- ----------------------------
INSERT INTO `service_categories` VALUES (1, 'Cleaning', '保洁服务');
INSERT INTO `service_categories` VALUES (2, 'Childcare', '育儿服务');
INSERT INTO `service_categories` VALUES (3, 'Moving', '搬家服务');

-- ----------------------------
-- Table structure for service_providers
-- ----------------------------
DROP TABLE IF EXISTS `service_providers`;
CREATE TABLE `service_providers`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '服务人员ID',
  `user_id` int NOT NULL COMMENT '关联用户ID',
  `rating` decimal(3, 2) NULL DEFAULT 0.00 COMMENT '服务人员平均评分',
  `status` enum('pending','approved','rejected','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入日期',
  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '个人简介',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `service_providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '服务人员表，存储家政服务人员详情' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of service_providers
-- ----------------------------
INSERT INTO `service_providers` VALUES (1, 4, 0.00, 'approved', '2025-11-28 08:34:48', '多年保洁经验, 服务态度好');
INSERT INTO `service_providers` VALUES (2, 5, 0.00, 'approved', '2025-11-28 08:34:48', '拥有育儿资格证, 经验丰富');

-- ----------------------------
-- Table structure for services
-- ----------------------------
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '服务项目ID',
  `category_id` int NOT NULL COMMENT '所属分类ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '服务项目名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '服务详情描述',
  `price` decimal(10, 2) NOT NULL COMMENT '价格',
  `price_unit` enum('hour','day','session','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'hour' COMMENT '价格单位',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家政具体服务项目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of services
-- ----------------------------
INSERT INTO `services` VALUES (1, 1, 'House Cleaning', '家庭日常清洁服务', 100.00, 'hour');
INSERT INTO `services` VALUES (2, 1, 'Carpet Cleaning', '地毯深度清洗', 150.00, 'hour');
INSERT INTO `services` VALUES (3, 2, 'Babysitting', '儿童看护服务', 80.00, 'hour');
INSERT INTO `services` VALUES (4, 3, 'Piano Moving', '钢琴搬运服务', 200.00, 'session');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名/登录账号',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '加密密码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `role` enum('customer','service_provider','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户角色',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '账号状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表，存储所有用户基本信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'zhangwei', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '张伟', '13800138000', 'zhangwei@example.com', 'customer', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:00');
INSERT INTO `users` VALUES (2, 'wangfang', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '王芳', '13800138001', 'wangfang@example.com', 'customer', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:01');
INSERT INTO `users` VALUES (3, 'lina', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '李娜', '13800138002', 'lina@example.com', 'customer', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:02');
INSERT INTO `users` VALUES (4, 'zhaoqiang', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '赵强', '13800138003', 'zhaoqiang@example.com', 'service_provider', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:03');
INSERT INTO `users` VALUES (5, 'zhoumin', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '周敏', '13800138004', 'zhoumin@example.com', 'service_provider', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:04');
INSERT INTO `users` VALUES (6, 'admin', '$2a$10$75cB2RJreOPJe8fyR/olI.s9R6ZJjGeGD2oiVq/EGeF9GkMCnp8Bi', '管理员', '13800138005', 'admin@example.com', 'admin', 'active', '2025-11-28 08:34:48', '2025-11-28 08:37:12');

SET FOREIGN_KEY_CHECKS = 1;
-- ----------------------------
-- Table structure for provider_services
-- 服务人员可提供的服务关联表
-- ----------------------------
DROP TABLE IF EXISTS `provider_services`;
CREATE TABLE `provider_services` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `provider_id` int NOT NULL COMMENT '服务人员ID',
  `service_id` int NOT NULL COMMENT '服务项目ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_provider_service` (`provider_id`, `service_id`) USING BTREE COMMENT '唯一约束：一个服务人员不能重复添加同一个服务',
  INDEX `idx_provider_id`(`provider_id` ASC) USING BTREE,
  INDEX `idx_service_id`(`service_id` ASC) USING BTREE,
  CONSTRAINT `provider_services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `provider_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '服务人员可提供的服务关联表';
