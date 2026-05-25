# ErisPulse Workers

这是在 CloudFlare 上 erisdev.com Page使用的代码。

## 功能说明

该 Worker 主要用于处理对 ErisPulse 项目的各种资源请求，包括包信息、模块映射、OAuth 认证、模块提交以及缓存管理。

## 路由说明

- `/`                       - 会重定向到主站: https://www.erisdev.com
- `/packages.json`          - 提供 packages.json 文件内容，缓存4小时
- `/map.json`               - 提供 map.json 文件内容，缓存4小时
- `/archived/modules/*`     - 提供已归档模块文件，缓存4小时
- `/purge-cache/{password}` - 清除缓存端点（需要密码验证）
- `/api/oauth-token`        - OAuth 统一 Token 交换端点（支持 GitHub / Codeberg / Yunhu）
- `/api/check-pypi`         - 检查 PyPI 包是否存在
- `/api/submit-module`      - 模块提交代理（触发 GitHub Actions `repository_dispatch`）

## 缓存策略

- packages.json 和 map.json 文件会被缓存 4 小时 (14400 秒)
- 所有 archived/modules 下的文件也会被缓存 4 小时
- 缓存可以通过 /purge-cache/ 端点手动清除

## 安全说明

缓存清除功能的密码通过 Cloudflare Worker 环境变量 `PURGE_PASSWORD` 配置

## 环境变量

以下环境变量需要在 Cloudflare Worker 控制台中配置：

| 变量名 | 说明 |
|--------|------|
| `PURGE_PASSWORD` | 缓存清除密码 |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_ACTIONS_TOKEN` | GitHub Classic PAT（`public_repo` 权限） |
| `CODEBERG_CLIENT_SECRET` | Codeberg OAuth App Client Secret |
| `YUNHU_CLIENT_ID` | 云湖 OAuth Client ID |
| `YUNHU_CLIENT_SECRET` | 云湖 OAuth Client Secret |

## 目录
- [index.js](index.js)
