# Home 项目 / Home Project

## 概览 Overview

Home 是一个基于 **Spring Boot + MySQL** 的后端和 **Vue 3 + Vite + TailwindCSS** 的前端组成的全栈示例项目，用于管理预约、订单、服务等业务数据，并提供可视化前端界面。

Home is a full‑stack sample project composed of a **Spring Boot + MySQL** backend and a **Vue 3 + Vite + TailwindCSS** frontend. It manages appointments, orders, services and related business data, and exposes them through a web UI.

---

## 技术栈 Tech Stack

### 后端 Backend
- Java **21**
- Spring Boot **4.x**
- Spring Web, Spring Data JPA, Spring JDBC, Spring Validation, Spring Mail
- MySQL + Flyway 数据库迁移
- Maven 构建（`pom.xml`）

### 前端 Frontend
- Vue **3**
- Vue Router **4**
- Vite **6**
- TypeScript
- TailwindCSS

---

## 目录结构 Project Structure

根目录主要结构如下（简化）：

```text
home/
├── src/                      # 后端 Java 源码 Backend Java sources
│   └── main/
│       ├── java/org/example/home/
│       │   ├── HomeApplication.java   # Spring Boot 入口 Main entry
│       │   └── config/                # Web 与全局配置 Web & global config
│       └── resources/
│           └── application.properties # 应用配置 App configuration
├── front/                    # 前端工程 Frontend project (Vite + Vue)
│   ├── src/
│   │   ├── main.ts           # 前端入口 Frontend entry
│   │   ├── router.ts         # 路由配置 Router configuration
│   │   └── services/         # API 适配与调用层 API calls & adapters
│   ├── package.json
│   └── vite.config.ts
├── backend-migrations/       # （可选）数据库迁移与说明 DB migrations docs
├── homebook.sql              # 初始数据库脚本 Initial DB schema/data
├── run_data_tests.bat        # 测试数据生成与验证脚本 Test data script
├── pom.xml                   # Maven 配置 Maven configuration
├── HELP.md                   # Spring Boot 帮助文档 Help doc (generated)
└── docs/                     # 开发文档（本 README 引导） Dev docs (this index)
```

---

## 快速开始 Quick Start

### 1. 环境准备 Environment

- JDK **21**
- Node.js **18+**（推荐）
- MySQL 8.x
- Maven 3.8+

确保本地安装以上依赖，并且 MySQL 已启动且已创建数据库（默认：`homebook`）。

Make sure you have installed the above dependencies, MySQL is running, and the database (default: `homebook`) exists.

---

### 2. 数据库准备 Database Setup

1. 在 MySQL 中创建数据库 / Create database in MySQL，例如/for example：

```sql
CREATE DATABASE homebook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入初始脚本 / Import initial schema & data (if needed)：

```bash
# 在项目根目录执行 From project root
mysql -u root -p homebook < homebook.sql
```

> 实际账号/密码请根据你的环境修改。
> Adjust username/password according to your environment.

Spring Boot 还启用了 Flyway（`spring.flyway.enabled=true`），启动时会自动执行迁移脚本（如果存在）。
Spring Boot also enables Flyway (`spring.flyway.enabled=true`), which will run migration scripts on startup when present.

---

### 3. 启动后端 Start Backend

在项目根目录执行：

```bash
mvn spring-boot:run
```

或在 IDE 中运行 `HomeApplication` 主类。

Or run the `HomeApplication` main class from your IDE.

- 默认端口 / Default port: `8081`
- 主要 API 前缀 / Main API prefix: `/api`

关键配置位于 `src/main/resources/application.properties`：

- 数据源 / Datasource
- JPA & Hibernate
- Flyway
- Jackson 命名策略（`SNAKE_CASE`）/ Jackson naming strategy
- 邮件配置 / Mail settings

---

### 4. 启动前端 Start Frontend

进入前端目录 / Go to frontend directory：

```bash
cd front
npm install
npm run dev
```

- 默认端口 / Default port: `3000`
- Vite 开发服务器会通过 CORS 调用后端 `http://localhost:8081/api`。
The Vite dev server will call the backend at `http://localhost:8081/api` via CORS.

> 前端使用 `realApi.ts` 和 `apiAdapter.ts` 作为 API 封装层，统一处理请求和响应。
> The frontend uses `realApi.ts` and `apiAdapter.ts` as API abstraction layers to unify request/response handling.

---

## 测试数据脚本 Test Data Script

项目根目录提供了 `run_data_tests.bat`，用于生成并验证测试数据（如 2025 年订单、预约统计等）。

The project includes `run_data_tests.bat` in the root directory to generate and validate test data (e.g., 2025 orders and appointment statistics).

### 使用步骤 Usage

1. 确认脚本中的数据库连接环境变量正确（可在脚本头部配置 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` 等）。
2. 双击运行脚本或在命令行中执行：

```bat
run_data_tests.bat
```

3. 脚本会：
   - 调用 SQL 脚本（如 `generate_2025_orders.sql`）生成测试数据；
   - 在控制台输出一段 SQL 查询，用于在 MySQL 中验证统计结果。

The script will:
- Execute SQL scripts such as `generate_2025_orders.sql` to generate test data.
- Print a SQL query to the console so you can copy it into MySQL to verify statistics.

示例验证查询（部分节选）：/ Example verification query (excerpt):

```sql
SELECT DATE_FORMAT(a.appointment_time, '%Y-%m') AS month,
       COUNT(*) AS appointments,
       COUNT(o.id) AS orders
FROM appointments a
LEFT JOIN orders o ON a.id = o.appointment_id
WHERE a.appointment_time >= '2025-01-01'
GROUP BY DATE_FORMAT(a.appointment_time, '%Y-%m')
ORDER BY month;
```

---

## 更多文档 More Documentation

更详细的开发说明请参见 `docs/` 目录：
For more detailed docs, see the `docs/` directory:

- `docs/backend.md`  
  后端运行、配置、包结构与数据库说明。  
  Backend run/configuration, package structure and database details.

- `docs/frontend.md`  
  前端开发、路由、组件与 API 调用规范。  
  Frontend development, routing, components and API usage guidelines.

---

## 许可与版权 License & Copyright

如未特别说明，本项目仅用于学习与内部演示，不建议直接用于生产环境。  
Unless explicitly stated, this project is intended for learning and internal demo only, and is not recommended for direct production use.
