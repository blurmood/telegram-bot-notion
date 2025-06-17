# 🤖 Telegram Bot Notion 同步服务 (TypeScript)

一个强大的 Cloudflare Workers 服务，用于将 Telegram 频道消息自动同步到 Notion 数据库，支持**永久有效的文件链接**和**智能文件处理**。

## ✨ 核心功能

- 📱 **全面消息支持**：文本、图片、视频、文件消息自动同步
- 🔄 **永久文件链接**：解决 Telegram 文件链接过期问题
- 🧠 **智能文件处理**：自动识别文件类型，正确分类转发图片
- ⚡ **大文件优化**：大文件快速失败，避免无效重试
- 📅 **精确时间戳**：创建日期精确到分钟级别
- 🎯 **流式传输**：Range 请求支持，视频流式传输
- 🔧 **媒体组支持**：智能处理多媒体消息组
- 🛡️ **类型安全**：完整的 TypeScript 类型定义

## 🚀 技术特性

- **TypeScript** 编写，提供完整的类型安全
- **Cloudflare Workers** 部署，全球边缘计算
- **模块化架构**，清晰的代码组织
- **KV 缓存**优化性能
- **智能错误处理**机制
- **完整的测试端点**
- **详细的调试信息**

## 📊 Notion 集成

- 自动属性填充
- 多媒体文件分类
- 消息元数据记录
- 永久文件链接生成

## 🛠️ 部署指南

### 1. 克隆项目
```bash
git clone https://github.com/blurmood/telegram-bot-notion.git
cd telegram-bot-notion
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在 Cloudflare Workers 控制台中设置以下环境变量：
- `NOTION_TOKEN`: Notion 集成令牌
- `NOTION_DATABASE_ID`: Notion 数据库 ID
- `TELEGRAM_BOT_TOKEN`: Telegram Bot 令牌

### 4. 构建和部署
```bash
# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 部署
npm run deploy
```

## 📋 API 端点

- `GET /` - 服务状态检查
- `POST /webhook` - Telegram Webhook 处理
- `GET /file/{file_id}` - 永久文件代理
- `GET /file/{file_id}/{filename}` - 带文件名的文件代理

## 🧪 测试端点

- `/test-forwarded-content-fix` - 测试转发内容修复
- `/test-media-group-content-fix` - 测试媒体组内容修复
- `/debug-media-group-message` - 调试媒体组消息结构

## 🏗️ 项目结构

```
src/
├── types/           # 类型定义
│   ├── telegram.ts  # Telegram API 类型
│   ├── notion.ts    # Notion API 类型
│   ├── app.ts       # 应用内部类型
│   └── index.ts     # 类型导出
├── utils/           # 工具函数
│   ├── file.ts      # 文件处理工具
│   └── mediaGroup.ts # 媒体组管理
├── services/        # 服务模块
│   └── notion.ts    # Notion API 服务
└── index.ts         # 主入口文件
```

## 📝 更新日志

### v2.0.0 - TypeScript 重构版本 🎯
- ✨ **完全 TypeScript 重写**：提供完整的类型安全
- 🏗️ **模块化架构**：清晰的代码组织结构
- 🔧 **修复转发消息内容提取问题**
- 🐛 **增强调试功能**
- 📚 **完整的类型定义**
- 🛡️ **编译时错误检查**
- 🚀 **更好的开发体验**

### v1.x.x - JavaScript 版本
- 基础功能实现
- 文件代理功能
- 媒体组支持

## 🔧 开发

### 类型安全
项目使用 TypeScript 提供完整的类型安全，包括：
- Telegram API 完整类型定义
- Notion API 完整类型定义
- 应用内部类型约束
- 编译时错误检查

### 代码组织
- **模块化设计**：功能按模块分离
- **类型驱动**：所有 API 都有完整类型定义
- **错误处理**：统一的错误处理机制
- **调试支持**：详细的调试信息

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License
