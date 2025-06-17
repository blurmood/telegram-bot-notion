# Telegram Bot Notion 同步服务

一个强大的 Cloudflare Workers 服务，用于将 Telegram 频道消息自动同步到 Notion 数据库，支持**永久有效的文件链接**和**智能文件处理**。

## ✨ 核心功能

### 🎯 解决的问题
- ❌ Telegram 文件链接会过期（通常24-72小时）
- ❌ Notion 中的图片/视频/文件变成无法访问
- ❌ 转发图片被错误识别为PDF文件
- ❌ 大文件处理耗时且容易失败

### ✅ 解决方案
- ✅ 自建文件代理服务，永不过期
- ✅ 智能MIME类型检测，正确分类文件
- ✅ 大文件快速失败，避免无效重试
- ✅ Range请求支持，视频流式传输
- ✅ 创建日期精确到分钟级别

## 🚀 功能特性

### 📱 消息类型支持
- **文本消息**：完整同步文本内容
- **图片消息**：支持多图片，自动代理和内联显示
- **视频消息**：支持视频文件，Range 请求流式传输
- **文档文件**：支持各种文档格式
- **转发消息**：智能识别转发图片，正确分类处理

### 🔧 智能文件处理
- **MIME类型检测**：准确识别文件类型，避免误分类
- **转发图片修复**：转发的图片正确识别为图片而非PDF
- **大文件优化**：>20MB文件立即返回错误，避免无效重试
- **Range请求支持**：视频文件支持分段加载和拖拽
- **智能重试机制**：区分永久性错误和临时性错误

### 🔄 永久链接功能
- **文件链接永不过期**：自建代理服务
- **缓存优化**：文件路径缓存1小时，提升性能
- **错误处理**：智能错误检测和友好提示
- **CORS支持**：跨域访问无障碍
- **详细日志**：完整的调试信息

## 📋 快速开始

### 1. 部署准备

```bash
# 克隆项目
git clone <your-repo>
cd TelegramBotNotion

# 创建 KV 存储
wrangler kv:namespace create "FILE_CACHE"
wrangler kv:namespace create "FILE_CACHE" --preview
```

### 2. 配置环境

更新 `wrangler.toml` 中的 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "FILE_CACHE"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

设置环境变量：

```bash
wrangler secret put NOTION_TOKEN
wrangler secret put NOTION_DATABASE_ID
wrangler secret put TELEGRAM_BOT_TOKEN
```

### 3. 部署

```bash
wrangler publish
```

### 4. 设置 Webhook

访问：`https://your-worker.your-subdomain.workers.dev/setWebhook`

## 📊 Notion 数据库结构

确保你的 Notion 数据库包含以下属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| 内容 | 标题 | 消息内容（主标题） |
| 消息类型 | 选择 | 文本/图片/视频/文件 |
| 消息ID | 数字 | Telegram 消息ID |
| 频道用户名 | 文本 | 来源频道 |
| 创建日期 | 日期 | 消息创建时间（精确到分钟） |
| 图片 | 文件 | 图片文件列表 |
| 视频 | 文件 | 视频文件列表 |
| 文件 | 文件 | 其他文件列表 |

## 🔧 API 端点

### 核心端点
- `POST /webhook` - Telegram Webhook 接收消息
- `GET /file/{file_id}` - **永久文件代理**
- `GET /file/{file_id}/{filename}` - 带文件名的代理

### 测试端点
- `GET /test-creation-date` - 测试创建日期功能
- `GET /test-forwarded-image-fix` - 测试转发图片修复
- `GET /test-optimized-error-handling` - 测试错误处理优化
- `GET /test-large-file-handling` - 测试大文件处理
- `GET /debug-error-format` - 调试错误信息格式

### 管理端点
- `GET /` - 服务状态
- `GET /setWebhook` - 设置Telegram Webhook
- `GET /debug` - 调试信息

## 💡 使用示例

### 永久链接格式

```
原来：https://api.telegram.org/file/bot{token}/{path}  ❌ 会过期
现在：https://your-worker.workers.dev/file/{file_id}   ✅ 永不过期
```

### 测试功能

```bash
# 测试代理功能
curl https://your-worker.workers.dev/test-file-proxy

# 测试文件访问（需要真实的file_id）
curl https://your-worker.workers.dev/file/BAADBAADrwADBREAAYag2eLPAg
```

## 🔍 监控和调试

```bash
# 查看实时日志
wrangler tail

# 本地开发
wrangler dev
```

## 📈 性能优化

- **KV 缓存**：文件路径缓存1小时，减少 API 调用
- **浏览器缓存**：文件内容缓存1年，提升访问速度
- **重试机制**：自动重试失败的 API 请求
- **流式传输**：支持大文件的高效传输

## 🛡️ 安全特性

- 环境变量保护敏感信息
- CORS 配置支持跨域访问
- 错误信息不泄露敏感数据
- 自动处理无效文件ID

## 📈 更新日志

### v2.0.0 (2025-06-17) - 智能文件处理
- ✅ **创建日期精确化**：支持精确到分钟的时间记录
- ✅ **转发图片修复**：修复转发图片被误识别为PDF的问题
- ✅ **大文件优化**：>20MB文件立即失败，避免7秒无效等待
- ✅ **智能错误处理**：区分永久性错误和临时性错误
- ✅ **MIME类型检测**：根据文件MIME类型正确分类
- ✅ **Range请求支持**：视频文件支持流式传输

### v1.5.0 - 永久链接功能
- 🔄 文件代理服务，链接永不过期
- ⚡ KV缓存优化，提升响应速度
- 🛡️ 完善的错误处理和重试机制

### v1.0.0 - 基础版本
- 🎉 初始版本发布
- 📱 支持基本消息类型同步
- 📊 Notion 数据库集成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📚 更多信息

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Notion API](https://developers.notion.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
