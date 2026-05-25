# ErisPulse Workers

这是在 CloudFlare 上 erisdev.com Page使用的代码。

## 功能说明

该 Worker 主要用于处理对 ErisPulse 项目的各种资源请求，包括包信息、模块映射、OAuth 认证、模块提交/管理以及缓存管理。

## 路由说明

### 基础路由

- `/`                       - 会重定向到主站: https://www.erisdev.com
- `/packages.json`          - 提供 packages.json 文件内容，缓存4小时
- `/map.json`               - 提供 map.json 文件内容，缓存4小时
- `/archived/modules/*`     - 提供已归档模块文件，缓存4小时
- `/purge-cache/{password}` - 清除缓存端点（需要密码验证）

### API 路由

| 路由 | 方法 | 说明 | 鉴权 |
|------|------|------|------|
| `/api/oauth-token` | POST | OAuth 统一 Token 交换（支持 GitHub / Codeberg / Yunhu） | 无 |
| `/api/userinfo` | POST | 用户信息代理（避免浏览器 CORS 限制） | access_token |
| `/api/avatar` | GET | 头像图片代理（解决云湖防盗链） | 无 |
| `/api/check-pypi` | GET | 检查 PyPI 包是否存在 | 无 |
| `/api/submit-module` | POST | 模块提交代理 | verifyUser |
| `/api/my-modules` | POST | 查询当前用户提交的模块 | verifyUser |
| `/api/manage-module` | POST | 模块管理（删除/隐藏/取消隐藏） | verifyUser |

## 缓存策略

- packages.json 和 map.json 文件会被缓存 4 小时 (14400 秒)
- 所有 archived/modules 下的文件也会被缓存 4 小时
- 缓存可以通过 /purge-cache/ 端点手动清除

## 安全说明

所有涉及用户身份的操作均通过 `verifyUser()` 函数在 Worker 端验证：
- 前端发送 `access_token` + `provider`
- Worker 用 token 调用对应 OAuth 提供商的 userinfo API 验证身份
- 从验证结果中提取 `uid`（如 `github:12345`），**不信任前端传入的 uid**
- `submitted_by`、`submitted_by_uid`、`oauth_provider` 均由 Worker 服务端填入

缓存清除功能的密码通过 Cloudflare Worker 环境变量 `PURGE_PASSWORD` 配置。

## 环境变量

以下环境变量需要在 Cloudflare Worker 控制台中配置：

| 变量名 | 说明 |
|--------|------|
| `PURGE_PASSWORD` | 缓存清除密码 |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_ACTIONS_TOKEN` | GitHub Classic PAT（`public_repo` 权限） |
| `CODEBERG_CLIENT_ID` | Codeberg OAuth App Client ID |
| `CODEBERG_CLIENT_SECRET` | Codeberg OAuth App Client Secret |
| `YUNHU_CLIENT_ID` | 云湖 OAuth Client ID |
| `YUNHU_CLIENT_SECRET` | 云湖 OAuth Client Secret |

## 架构流程图

### 模块提交流程

```
用户浏览器                Cloudflare Worker              GitHub Actions           packages.json
   │                          │                              │                       │
   │  1. OAuth 登录           │                              │                       │
   │ ───────────────────────> │                              │                       │
   │  (跳转到 GitHub/Codeberg/云湖 授权页)                    │                       │
   │                          │                              │                       │
   │  2. 回调 ?code=xxx       │                              │                       │
   │ ───────────────────────> │                              │                       │
   │                          │  3. 交换 token               │                       │
   │                          │ ────────────────────────────>│(OAuth Provider)       │
   │                          │ <────────────────────────────│                       │
   │  4. 返回 access_token   │                              │                       │
   │ <─────────────────────── │                              │                       │
   │                          │                              │                       │
   │  5. POST /api/userinfo   │                              │                       │
   │ ───────────────────────> │                              │                       │
   │                          │  6. 获取用户信息（服务端代理） │                       │
   │  <───────────────────────│                              │                       │
   │                          │                              │                       │
   │  7. 填写表单，提交        │                              │                       │
   │  POST /api/submit-module │                              │                       │
   │  (带 access_token)       │                              │                       │
   │ ───────────────────────> │                              │                       │
   │                          │  8. verifyUser() 验证身份     │                       │
   │                          │      ↓                       │                       │
   │                          │  9. 检查 PyPI / 频率限制      │                       │
   │                          │      ↓                       │                       │
   │                          │  10. repository_dispatch     │                       │
   │                          │ ────────────────────────────>│                       │
   │                          │                              │  11. handle_submission.py
   │                          │                              │ ─────────────────────>│
   │                          │                              │      写入 verified:false│
   │                          │                              │ <─────────────────────│
   │  12. 返回成功            │                              │  git push             │
   │ <─────────────────────── │                              │                       │
```

### 模块管理流程

```
用户浏览器                Cloudflare Worker              GitHub Actions           packages.json
   │                          │                              │                       │
   │  1. 点击"我的模块"标签    │                              │                       │
   │  POST /api/my-modules    │                              │                       │
   │  (带 access_token)       │                              │                       │
   │ ───────────────────────> │                              │                       │
   │                          │  2. verifyUser() 验证身份     │                       │
   │                          │  3. 获取 packages.json       │                       │
   │                          │  4. 按 uid 过滤返回          │                       │
   │  <───────────────────────│                              │                       │
   │                          │                              │                       │
   │  5. 点击"删除/隐藏"      │                              │                       │
   │  POST /api/manage-module │                              │                       │
   │  (带 access_token)       │                              │                       │
   │ ───────────────────────> │                              │                       │
   │                          │  6. verifyUser() 验证身份     │                       │
   │                          │  7. repository_dispatch      │                       │
   │                          │      (带 verified uid)       │                       │
   │                          │ ────────────────────────────>│                       │
   │                          │                              │  8. handle_management.py
   │                          │                              │     uid 所有权校验     │
   │                          │                              │ ─────────────────────>│
   │                          │                              │     删除/隐藏/取消隐藏 │
   │                          │                              │ <─────────────────────│
   │  9. 返回成功             │                              │  git push             │
   │ <─────────────────────── │                              │                       │
```

### 身份验证流程（verifyUser）

```
前端请求 (access_token + provider)
         │
         ▼
   ┌─────────────┐
   │  Worker      │
   │  verifyUser()│
   └──────┬──────┘
          │
          ▼
   根据 provider 调用对应 userinfo API
   ┌──────────────────────────────────┐
   │ GitHub  → api.github.com/user    │
   │ Codeberg→ codeberg.org/api/v1/user│
   │ Yunhu   → oauth2.jwzhd.com/api/userinfo│
   └──────────────────────────────────┘
          │
          ▼
   从响应中提取: uid, login, name, avatar_url
   ┌──────────────────────────────────┐
   │ GitHub  → github:{id}            │
   │ Codeberg→ codeberg:{id}          │
   │ Yunhu   → yunhu:{user_id}        │
   └──────────────────────────────────┘
          │
          ▼
   返回 verified 用户信息（或 null = 验证失败）
```

## 目录
- [index.js](index.js)
