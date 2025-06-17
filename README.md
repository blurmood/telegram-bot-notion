# Telegram Bot Notion

一个将Telegram频道消息自动同步到Notion数据库的TypeScript项目。

## 功能特性

### 🚀 核心功能
- **自动同步**：将Telegram频道消息实时同步到Notion数据库
- **多媒体支持**：支持文本、图片、视频、文档等多种消息类型
- **媒体组处理**：智能处理多图片/多视频消息，聚合到单个Notion页面
- **文件代理**：提供文件代理服务，支持视频流式传输和Range请求

### 📱 消息类型支持
- ✅ **文本消息**：纯文本内容同步
- ✅ **图片消息**：支持单张和多张图片
- ✅ **视频消息**：支持各种视频格式（MP4、MOV、AVI、WebM、MKV）
- ✅ **文档消息**：支持PDF等文档文件
- ✅ **媒体组消息**：多媒体消息智能聚合

### 🎯 高级特性
- **智能文本提取**：从多个字段提取消息文本内容
- **时间格式优化**：统一的两位数时间显示格式
- **错误处理**：完善的错误捕获和日志记录
- **缓存优化**：KV存储缓存，提升性能
- **类型安全**：完整的TypeScript类型定义

## 技术架构

### 🛠 技术栈
- **运行环境**：Cloudflare Workers
- **开发语言**：TypeScript
- **API集成**：Telegram Bot API + Notion API
- **存储**：Cloudflare KV（缓存）
- **构建工具**：TypeScript Compiler + Wrangler

### 📁 项目结构
```
src/
├── index.ts              # 主入口文件，处理Webhook和路由
├── types.ts              # TypeScript类型定义
├── services/
│   └── notion.ts         # Notion API服务
└── utils/
    ├── file.ts           # 文件处理工具
    └── mediaGroup.ts     # 媒体组处理工具
```

## 部署配置

### 🔧 环境变量
在Cloudflare Workers中配置以下环境变量：

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

### 📊 Notion数据库结构
确保Notion数据库包含以下属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| 内容 | 标题 | 消息文本内容 |
| 来源 | 富文本 | 消息来源频道 |
| 消息ID | 数字 | Telegram消息ID |
| 类型 | 选择 | 消息类型（文本/图片/视频等） |
| 频道 | 富文本 | 频道用户名 |
| 图片 | 文件 | 图片文件列表 |
| 视频 | 文件 | 视频文件列表 |
| 文件 | 文件 | 其他文件列表 |
| 创建日期 | 日期 | 消息创建时间 |

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/blurmood/telegram-bot-notion.git
cd telegram-bot-notion
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境
复制 `wrangler.toml.example` 到 `wrangler.toml` 并配置相关参数。

### 4. 本地开发
```bash
npm run dev
```

### 5. 部署到Cloudflare Workers
```bash
npm run deploy
```

### 6. 设置Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-worker-domain.workers.dev/webhook"}'
```

## API端点

### 🔗 主要路由
- `POST /webhook` - Telegram Webhook接收端点
- `GET /file/{file_id}` - 文件代理服务
- `GET /file/{file_id}/{filename}` - 带文件名的文件代理

## 更新日志

### v2.0.0 (最新)
- ✅ 完全迁移到TypeScript
- ✅ 修复媒体组多媒体显示问题
- ✅ 修复视频链接播放问题
- ✅ 修复媒体组文本内容提取问题
- ✅ 优化时间格式显示（两位数格式）
- ✅ 清理测试代码，优化代码结构
- ✅ 完善错误处理和类型安全

### v1.0.0
- ✅ 基础JavaScript版本
- ✅ 支持基本消息同步功能

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License
