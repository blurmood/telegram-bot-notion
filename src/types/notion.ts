/**
 * Notion API 类型定义
 */

// 基础类型
export interface NotionRichText {
  type: 'text';
  text: {
    content: string;
    link?: {
      url: string;
    } | null;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  plain_text?: string;
  href?: string | null;
}

// 属性类型
export interface NotionTitleProperty {
  title: NotionRichText[];
}

export interface NotionSelectProperty {
  select: {
    name: string;
    id?: string;
    color?: string;
  } | null;
}

export interface NotionUrlProperty {
  url: string | null;
}

export interface NotionDateProperty {
  date: {
    start: string;
    end?: string | null;
    time_zone?: string | null;
  } | null;
}

export interface NotionFileObject {
  type: 'external' | 'file';
  name: string;
  external?: {
    url: string;
  };
  file?: {
    url: string;
    expiry_time: string;
  };
}

export interface NotionFilesProperty {
  files: NotionFileObject[];
}

// 页面属性
export interface NotionPageProperties {
  '内容': NotionTitleProperty;
  '消息类型': NotionSelectProperty;
  '消息链接': NotionUrlProperty;
  '创建日期': NotionDateProperty;
  '图片': NotionFilesProperty;
  '视频': NotionFilesProperty;
  '文件': NotionFilesProperty;
}

// 块类型
export interface NotionBlock {
  object: 'block';
  id?: string;
  type: string;
  created_time?: string;
  created_by?: any;
  last_edited_time?: string;
  last_edited_by?: any;
  archived?: boolean;
  has_children?: boolean;
}

export interface NotionImageBlock extends NotionBlock {
  type: 'image';
  image: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time: string;
    };
    caption?: NotionRichText[];
  };
}

export interface NotionVideoBlock extends NotionBlock {
  type: 'video';
  video: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time: string;
    };
    caption?: NotionRichText[];
  };
}

// 页面类型
export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  created_by: any;
  last_edited_time: string;
  last_edited_by: any;
  cover?: any;
  icon?: any;
  parent: {
    type: 'database_id';
    database_id: string;
  };
  archived: boolean;
  properties: Partial<NotionPageProperties>;
  url: string;
}

// 数据库类型
export interface NotionDatabase {
  object: 'database';
  id: string;
  created_time: string;
  created_by: any;
  last_edited_time: string;
  last_edited_by: any;
  title: NotionRichText[];
  description: NotionRichText[];
  icon?: any;
  cover?: any;
  properties: Record<string, any>;
  parent: any;
  url: string;
  archived: boolean;
}

// API 响应类型
export interface NotionApiResponse<T = any> {
  object?: string;
  results?: T[];
  next_cursor?: string | null;
  has_more?: boolean;
  type?: string;
  page?: any;
  // 错误响应
  status?: number;
  code?: string;
  message?: string;
}

// 创建页面请求类型
export interface CreatePageRequest {
  parent: {
    database_id: string;
  };
  properties: Partial<NotionPageProperties>;
  children?: NotionBlock[];
}

// 更新页面请求类型
export interface UpdatePageRequest {
  properties?: Partial<NotionPageProperties>;
  archived?: boolean;
}

// 添加块请求类型
export interface AppendBlockChildrenRequest {
  children: NotionBlock[];
}
