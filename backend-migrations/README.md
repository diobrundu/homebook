# 后端迁移建议

包含对数据库与后端 DTO 的建议，以便前端与后端数据结构一致。

主要变更
- 在 `appointments` 表新增 `price` 字段用于记录服务成交价（快照），避免未来订单金额变更影响历史预约显示。
- 将 `users.status` enum 扩展为 `('active','inactive','pending')`，以支持注册后待验证状态。
- 可选：为 `users` 添加 `profile_picture`（varchar）与 `notification_preferences`（json）字段，或在后端以 DTO/关联表返回这些信息。

SQL 脚本
请参见同目录 `001_add_price_and_pending_status.sql`。

后端 API / DTO 建议
- 在用户 DTO（例如 `UserDto`）中暴露的字段应为 camelCase：`id, username, name, phone, email, role, status, profilePicture, notificationPreferences`。
- 对于预约（AppointmentDto）建议包含：`id, customerId, customerName, providerId, providerName, serviceId, serviceName, appointmentTime, durationHours, address, status, price`。
- 对于订单（OrderDto）建议包含：`id, appointmentId, orderNumber, amount, paymentStatus, paymentMethod, createdAt`。

实现提示
- Java/Spring: 使用 Jackson 的 `PropertyNamingStrategies.SNAKE_CASE` 在 Controller 层自动把 snake_case 转为 camelCase DTO，或在 Service 层组装 DTO 后返回。
- 若修改 enum（MySQL），请先在应用层兼容处理（先接收旧值/新值），再运行 DB 迁移。

回滚策略
- 对于添加列的操作，可通过 `ALTER TABLE ... DROP COLUMN` 回滚。对于 enum 的回滚需要谨慎：如果回滚移除 'pending'，确保没有记录使用该值。
