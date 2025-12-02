# 后端开发文档 / Backend Development Guide

## 1. 概览 Overview

本后端基于 **Spring Boot 4**，使用 Spring Web、Spring Data JPA、Spring JDBC、Validation、Mail 等组件，连接 **MySQL** 数据库，并通过 REST API 向前端提供服务。

The backend is built on **Spring Boot 4**, using Spring Web, Spring Data JPA, Spring JDBC, Validation, and Mail to connect to a **MySQL** database and expose REST APIs for the frontend.

---

## 2. 运行与调试 Run & Debug

### 2.1 启动方式 How to Run

在项目根目录执行：

```bash
mvn spring-boot:run
```

或在 IDE 中运行 `org.example.home.HomeApplication` 主类。

Or run the `org.example.home.HomeApplication` main class in your IDE.

- 默认端口 / Default port: `8081`
- 根路径 / Context path: `/`（默认）
- API 前缀 / API prefix: 建议统一使用 `/api/**`（与前端约定）

### 2.2 常用配置文件 Key Config Files

- `src/main/java/org/example/home/HomeApplication.java`  
  Spring Boot 启动类。  
  Spring Boot main application class.

- `src/main/resources/application.properties`  
  应用配置（数据库、JPA、Flyway、Jackson、Mail 等）。  
  Application configuration (database, JPA, Flyway, Jackson, Mail, etc.).

- `src/main/java/org/example/home/config/WebConfig.java`  
  WebMVC 配置：默认 JSON 编码、CORS 设置等。  
  WebMVC configuration: default JSON encoding and CORS.

---

## 3. 配置说明 Configuration Details

### 3.1 数据源与 JPA Datasource & JPA

`application.properties` 中与数据库相关的核心配置：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/homebook?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

说明 / Notes：
- 修改 `url`、`username`、`password` 以匹配实际数据库环境。  
  Adjust `url`, `username`, `password` to your local/production DB.
- `ddl-auto=update` 适合开发环境；生产环境建议使用 `validate` 或关闭自动建表，仅依赖 Flyway。  
  `ddl-auto=update` is fine for dev, while production should use `validate` or rely solely on Flyway.

### 3.2 Flyway 迁移 Flyway Migrations

```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
```

- 启用 Flyway 后，启动应用时会自动执行 `db/migration` 下的 SQL 脚本（默认约定）。
- `baseline-on-migrate=true` 允许在已有数据的库上应用迁移。

With Flyway enabled, migration scripts under `db/migration` (by convention) will run on startup. `baseline-on-migrate=true` allows migrations on existing schemas.

### 3.3 JSON 命名策略 JSON Naming Strategy

```properties
spring.jackson.property-naming-strategy=SNAKE_CASE
```

- 后端返回 JSON 时会使用 `snake_case`（例如 `created_at`），以匹配前端 `apiAdapter` 的适配逻辑。
- 注意：实体字段命名仍然可以使用 `camelCase`，仅在序列化为 JSON 时转换。

The backend serializes JSON in `snake_case`, which matches the frontend adapter expectations. Entity fields may still use `camelCase` in Java.

### 3.4 邮件配置 Mail Settings

```properties
spring.mail.host=smtp.qq.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:1022229666@qq.com}
spring.mail.password=${MAIL_PASSWORD:bvhxlyhjhbrvbeig}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

- 实际部署时应通过环境变量 `MAIL_USERNAME`、`MAIL_PASSWORD` 或外部配置文件覆盖默认值，避免硬编码密码。  
  In production, override credentials via `MAIL_USERNAME`/`MAIL_PASSWORD` or external conf.

---

## 4. Web 配置与 CORS Web Config & CORS

`org.example.home.config.WebConfig`：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    public static final MediaType APPLICATION_JSON_UTF8 = new MediaType(
        MediaType.APPLICATION_JSON.getType(),
        MediaType.APPLICATION_JSON.getSubtype(),
        StandardCharsets.UTF_8
    );

    public static final String APPLICATION_JSON_UTF8_VALUE = "application/json;charset=UTF-8";

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.defaultContentType(APPLICATION_JSON_UTF8);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

说明 / Notes：
- 为 `/api/**` 路径开启 CORS，以便本地 Vite 开发服务器访问。  
  Enables CORS for `/api/**` so the Vite dev server can call APIs.
- `allowedOrigins` 列出前端可能使用的本地端口。  
  `allowedOrigins` lists possible frontend dev ports.

---

## 5. 包结构建议 Package Structure (Suggested)

下面是典型的包结构建议（具体以实际代码为准）：

Suggested typical package structure (adjust to your codebase):

```text
org.example.home
├── HomeApplication        # 启动类 / Main application
├── config                 # 通用配置 / Common configuration
├── controller             # REST 控制器 / REST controllers
├── service                # 业务逻辑 / Business services
├── repository             # 数据访问 / Data access (Spring Data JPA)
└── entity                 # 实体类 / Entities (JPA)
```

- `controller`：处理 HTTP 请求，返回 DTO 或实体。  
  Handles HTTP requests and returns DTOs/entities.
- `service`：封装业务逻辑，不直接依赖 Web 层。  
  Encapsulates business logic, independent from Web layer.
- `repository`：使用 Spring Data JPA 接口（如 `JpaRepository`）。  
  Uses Spring Data JPA repositories.
- `entity`：使用 JPA 注解映射到数据库表。  
  Entity classes with JPA annotations.

---

## 6. 与前端的接口约定 API Contract with Frontend

### 6.1 URL 与基础路径 URL & Base Path

- 基础 URL / Base URL: `http://localhost:8081`
- API 路径前缀 / API prefix: `/api`

前端的 `realApi.ts` 使用类似：

```ts
const API_BASE_URL = 'http://localhost:8081/api';
```

因此后端控制器建议使用：

- `@RequestMapping("/api/...")` 或  
- 在类级别使用 `/api/...` 的前缀。

The frontend expects APIs under `/api`, so controllers should map paths accordingly.

### 6.2 JSON 结构与错误处理 JSON Structure & Error Handling

- 默认使用 `SNAKE_CASE` 字段名。  
  Default JSON field naming is `snake_case`.
- 建议统一错误返回格式，例如：

```json
{
  "error": "INVALID_ARGUMENT",
  "message": "Invalid appointment id."
}
```

前端的 `handleArrayResponse`、`handleObjectResponse` 会尝试解析错误响应中的 `error` 字段：

```ts
const error = await response.json().catch(() => ({ error: response.statusText }));
throw new Error(error.error || `HTTP error! status: ${response.status}`);
```

因此后端在返回错误时最好带 `error` 字段，以便前端显示更友好的提示。

The frontend helpers expect an `error` field in JSON errors; it is recommended to follow this convention.

---

## 7. 测试数据脚本与数据验证 Test Data Script & Data Verification

项目根目录下有 `run_data_tests.bat`，用于生成测试数据并验证统计是否符合预期。

There is a `run_data_tests.bat` script in the project root to generate test data and verify statistics.

### 7.1 脚本作用 What the Script Does

- 基于预先编写的 SQL 脚本（如 `generate_2025_orders.sql`）插入或更新测试数据；
- 如果执行失败，会在控制台提示错误；
- 完成后会输出一条 SQL 查询，供你在 MySQL 中检查按月份统计的预约和订单数。

It:
- Executes SQL scripts such as `generate_2025_orders.sql` to insert or update test data;
- Prints an error if execution fails;
- Outputs an SQL query to check monthly appointments and orders.

### 7.2 使用步骤 How to Use

1. 根据需要在 `run_data_tests.bat` 中配置数据库连接（环境变量或脚本顶部）。  
   Configure DB connection in `run_data_tests.bat` if needed.

2. 在 Windows 命令行中从项目根目录执行：

```bat
run_data_tests.bat
```

3. 脚本执行成功后会提示：

```text
测试完成！
请在MySQL中运行以下查询验证数据:
SELECT DATE_FORMAT(a.appointment_time, '%Y-%m') AS month,
       COUNT(*) AS appointments,
       COUNT(o.id) AS orders
...
```

4. 将输出的 SQL 复制到 MySQL 客户端中执行，验证 2025 年各月份的预约与订单数量是否正确。

Copy the printed SQL query into your MySQL client to verify monthly statistics for 2025.

---

## 8. 开发建议 Development Tips

- 在开发环境中保持 `spring.jpa.show-sql=true`，便于调试 SQL；生产环境可关闭。  
  Keep `spring.jpa.show-sql=true` for dev, disable it in production.
- 复杂查询可以使用 Spring Data JPA 的 `@Query` 或命名查询。  
  Use `@Query` or named queries for complex queries.
- 与前端联调时注意 CORS 与端口设置；必要时可在 `WebConfig` 中追加允许的来源。  
  When debugging with the frontend, ensure CORS and ports are aligned; update `WebConfig` if needed.

---

## 9. 后续扩展 Next Steps

- 增加统一的异常处理（`@ControllerAdvice`）和标准错误响应格式；  
  Add `@ControllerAdvice` with unified error responses.
- 为关键接口编写集成测试（使用 Spring Boot Test）。  
  Add integration tests for key APIs.
- 在 README 或 `docs/` 中维护最新的 API 列表和示例请求。  
  Maintain an up‑to‑date API list and sample requests in README or `docs/`.
