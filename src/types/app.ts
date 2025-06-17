/**
 * 应用内部类型定义
 */

import { MessageType } from './telegram';

// 环境变量类型
export interface Environment {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  TELEGRAM_BOT_TOKEN: string;
  FILE_CACHE: KVNamespace;
}

// 媒体组信息类型
export interface MediaGroupInfo {
  pageId: string;
  timestamp: number;
  imageUrls: string[];
  videoUrls: string[];
  fileUrls: string[];
  messageContent: string;
  chatTitle: string;
}

// 文件信息类型
export interface FileInfo {
  fileId: string;
  filePath: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
}

// 消息处理结果类型
export interface MessageProcessResult {
  success: boolean;
  pageId?: string;
  error?: string;
  messageType: MessageType;
  contentExtracted: string;
  mediaCount: {
    images: number;
    videos: number;
    files: number;
  };
}

// API 错误类型
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

// 文件处理选项
export interface FileProcessOptions {
  fileType: 'image' | 'video' | 'document' | 'audio';
  generateSmartUrl: boolean;
  cacheEnabled: boolean;
  maxRetries: number;
}

// 调试信息类型
export interface DebugInfo {
  timestamp: string;
  requestPath: string;
  messageId?: number;
  mediaGroupId?: string;
  channelPost?: any;
  extractedContent?: string;
  processingSteps: string[];
  errors: string[];
}

// 测试响应类型
export interface TestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

// 文件代理响应类型
export interface FileProxyResponse {
  success: boolean;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
  error?: string;
  cached: boolean;
}

// 统计信息类型
export interface Statistics {
  totalMessages: number;
  messagesByType: Record<MessageType, number>;
  totalFiles: number;
  filesByType: Record<string, number>;
  errors: number;
  lastProcessed: string;
}

// 配置类型
export interface AppConfig {
  mediaGroupExpiry: number; // 媒体组过期时间（毫秒）
  maxFileSize: number; // 最大文件大小（字节）
  retryAttempts: number; // 重试次数
  cacheEnabled: boolean; // 是否启用缓存
  debugMode: boolean; // 调试模式
}

// 默认配置
export const DEFAULT_CONFIG: AppConfig = {
  mediaGroupExpiry: 12 * 60 * 60 * 1000, // 12小时
  maxFileSize: 20 * 1024 * 1024, // 20MB
  retryAttempts: 3,
  cacheEnabled: true,
  debugMode: false,
};

// 响应类型联合
export type ApiResponse<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

// 处理器函数类型
export type RequestHandler = (
  request: Request,
  env: Environment,
  ctx: ExecutionContext
) => Promise<Response>;

// 路由映射类型
export type RouteMap = Record<string, RequestHandler>;
