# ErisPulse Workers

这是在 CloudFlare 上 erisdev.com Page使用的代码。

## 功能说明

该 Worker 主要用于处理对 ErisPulse 项目的各种资源请求，包括包信息、模块映射以及缓存管理。

## 路由说明

- `/`                       - 会重定向到主站: https://www.erisdev.com
- `/packages.json`          - 提供 packages.json 文件内容，缓存4小时
- `/map.json`               - 提供 map.json 文件内容，缓存4小时
- `/archived/modules/*`     - 提供已归档模块文件，缓存4小时
- `/purge-cache/{password}` - 清除缓存端点（需要密码验证）

## 缓存策略

- packages.json 和 map.json 文件会被缓存 4 小时 (14400 秒)
- 所有 archived/modules 下的文件也会被缓存 4 小时
- 缓存可以通过 /purge-cache/ 端点手动清除

## 安全说明

缓存清除功能需要密码验证，密码在代码中的 `PURGE_PASSWORD` 常量中设置。

## 目录
- [index.js](index.js)