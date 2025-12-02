# 前端开发文档 / Frontend Development Guide

## 1. 概览 Overview

前端基于 **Vite + Vue 3 + TypeScript + TailwindCSS**，与后端 `Spring Boot` 通过 REST API 通信。  
The frontend is built with **Vite + Vue 3 + TypeScript + TailwindCSS**, communicating with the Spring Boot backend via REST APIs.

---

## 2. 运行与构建 Run & Build

### 2.1 安装依赖 Install Dependencies

在前端目录 `front/` 中执行：

```bash
cd front
npm install
```

或使用 `pnpm`/`yarn`（需自行维护锁文件）。  
Or use `pnpm`/`yarn` if you prefer (remember to manage lockfiles yourself).

### 2.2 开发模式 Development Mode

```bash
npm run dev
```

- 默认端口 / Default port: 通常为 `5173` 或 `3000`（取决于 Vite 配置，当前配置中 server.port = 3000）。
- 本项目在 `vite.config.ts` 中显式设置：

```ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [vue()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
```

说明 / Notes：
- dev server 监听 `0.0.0.0:3000`，方便在局域网设备上访问。  
  Dev server listens on `0.0.0.0:3000` so it can be accessed from LAN devices.
- 使用 `@` 作为 `src` 目录的别名。  
  `@` is configured as an alias for the `src` directory.

### 2.3 构建生产包 Build for Production

```bash
npm run build
```

生成的静态文件位于 `dist/` 目录（在 `front/` 下）。  
The production bundle will be generated under `front/dist/`.

可使用：

```bash
npm run preview
```

在本地预览生产构建。  
To preview the production build locally.

---

## 3. 目录结构 Directory Structure

核心目录结构（位于 `front/`）：

```text
front/
├── src/
│   ├── main.ts           # 应用入口 / App entry
│   ├── router.ts         # 路由配置 / Router configuration
│   ├── assets/           # 静态资源 / Static assets (including Tailwind CSS)
│   ├── components/       # 复用组件 / Reusable components
│   ├── views/            # 页面级组件 / Page-level components
│   └── services/         # API 层与适配 / API layer & adapters
├── package.json
└── vite.config.ts
```

### 3.1 入口文件 Entry File `main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './assets/tailwind.css';

const app = createApp(App);

app.use(router);
app.mount('#app');
```

- 注册路由 / Registers the router.
- 引入 Tailwind 样式 / Imports Tailwind styles.

### 3.2 路由配置 Router `router.ts`

`router.ts` 中定义应用的路由表（视项目实际情况而定）：

- 推荐使用 **命名路由** 与 **懒加载组件**，例如：

```ts
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/appointments', name: 'appointments', component: () => import('./views/AppointmentsView.vue') },
];
```

- 前端在路由层与后端 API 保持 URL 语义一致，有助于调试。

Use named routes and lazy-loaded components where appropriate, and try to keep route semantics aligned with backend resources.

---

## 4. API 调用与适配层 API Calls & Adapters

前端通过 `services/` 目录下的模块访问后端 API：

- `services/realApi.ts`：封装具体业务 API 调用。  
  Encapsulates business‑level API calls.
- `services/apiAdapter.ts`：提供通用的适配与类型转换（从后端 JSON 到前端类型）。  
  Provides generic adapters & type conversions from backend JSON to frontend types.

### 4.1 基础 URL Base URL

`realApi.ts` 中：

```ts
const API_BASE_URL = 'http://localhost:8081/api';
```

要求后端 API 路径以 `/api` 为前缀。  
The backend is expected to expose APIs under `/api`.

### 4.2 通用响应处理 Helpers for Responses

示例（节选）：

```ts
async function handleArrayResponse<T>(response: Response, mapper: (data: any) => T): Promise<T[]> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapper) : [mapper(data)];
}

async function handleObjectResponse<T>(response: Response, mapper?: (data: any) => T): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (mapper) {
    return mapper(data);
  }
  return data as T;
}
```

说明 / Notes：
- 若后端在错误响应中返回 `{ "error": "..." }` 字段，前端会优先显示此错误信息。  
  If the backend returns an `error` field, the frontend will show it as the main error message.
- 成功响应会统一走 `mapper` 函数，将原始 JSON 转为前端 `types.ts` 中定义的类型。  
  On success, `mapper` transforms raw JSON to the TypeScript types defined in `types.ts`.

### 4.3 ID 提取工具 ID Extraction Helper

`realApi.ts` 中还包含一个用于从对象中提取 ID 的辅助函数：

```ts
function extractId(obj: any, ...paths: string[]): number | null {
  if (!obj) {
    return null;
  }
  for (const path of paths) {
    const parts = path.split('.');
    let value: any = obj;
    let validPath = true;
    for (const part of parts) {
      if (value == null || value === undefined) {
        validPath = false;
        break;
      }
      value = value[part];
    }
    if (validPath && value != null && value !== undefined) {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        return numValue;
      }
    }
  }
  return null;
}
```

用于适配不同后端响应结构（例如 `user.id` 或 `user.user_id`）。  
This helper adapts to different backend response shapes (e.g., `user.id` vs. `user.user_id`).

---

## 5. 样式与 TailwindCSS Styles & TailwindCSS

前端使用 TailwindCSS 管理样式：

- 在 `main.ts` 中全局引入：`import './assets/tailwind.css';`
- 可以在组件中直接使用 Tailwind 的工具类（如 `flex`, `items-center`, `bg-gray-100` 等）。

The project uses TailwindCSS for styling. Utility classes can be used directly in Vue templates.

建议：
- 公共布局组件（如导航栏、布局容器）可以统一管理基础样式；
- 复杂页面可以结合少量自定义 CSS 或 `@apply` 指令。

Use layout components for common layout styles and optionally combine with custom CSS or `@apply` when necessary.

---

## 6. 环境变量与敏感信息 Env Variables & Secrets

`vite.config.ts` 中通过 `loadEnv` 读取环境变量，如：

```ts
const env = loadEnv(mode, '.', '');

define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

说明 / Notes：
- 在项目根目录或 `front/` 目录下可以创建 `.env.development`、`.env.production` 等文件来提供 `GEMINI_API_KEY` 等变量。  
  You can define `GEMINI_API_KEY` and other variables in `.env.development`, `.env.production`, etc.
- 不要将真实密钥提交到版本库中。  
  Never commit real API keys or secrets to the repository.

---

## 7. 与后端联调 Tips for Working with the Backend

- 确保后端运行在 `http://localhost:8081`，且 CORS 已在 `WebConfig` 中放行前端端口（`http://localhost:3000` 等）。  
  Make sure the backend is running on `http://localhost:8081` and CORS allows `http://localhost:3000`.
- 前端统一通过 `realApi.ts` 暴露的函数访问后端接口，避免在组件中直接使用 `fetch` 或 `axios`。  
  Use the functions in `realApi.ts` instead of calling `fetch`/`axios` directly in components.
- 如果后端 JSON 字段命名发生变更（如由 `snake_case` 改为 `camelCase`），需要同步更新 `apiAdapter.ts` 中的映射逻辑。  
  If backend JSON naming changes (e.g., from `snake_case` to `camelCase`), update mapping logic in `apiAdapter.ts`.

---

## 8. 代码风格与最佳实践 Code Style & Best Practices

- 组件拆分：保持单个组件职责单一，页面级组件只负责组合和协调。  
  Keep components focused; page-level components should orchestrate smaller components.
- 类型定义：在 `types.ts` 中集中管理业务实体类型（User, Service, Appointment 等）。  
  Define business entity types (User, Service, Appointment, etc.) in `types.ts`.
- 错误处理：前端应对 `handleArrayResponse` / `handleObjectResponse` 抛出的错误进行统一处理（如在页面级捕获后显示消息）。  
  Handle errors from `handleArrayResponse` / `handleObjectResponse` in a unified way (e.g., page-level error messages).
- 路由守卫：如有用户登录/权限控制需求，可在 `router.beforeEach` 中实现简单的路由守卫。  
  Implement `router.beforeEach` guards if you need auth/permission checks.

---

## 9. 后续扩展建议 Future Enhancements

- 引入状态管理方案（如 Pinia）统一管理全局状态（用户、订单列表等）。  
  Introduce a state management library (e.g., Pinia) for global state.
- 增加国际化支持（如 vue-i18n），方便中英切换。  
  Add i18n (e.g., vue-i18n) for multilingual support.
- 对关键页面和组件编写单元测试与端到端测试（Vitest / Cypress）。  
  Add unit tests and end-to-end tests (Vitest / Cypress) for key views and components.
