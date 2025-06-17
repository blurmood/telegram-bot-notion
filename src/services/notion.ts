/**
 * Notion API 服务
 */

import { 
  NotionImageBlock, 
  NotionVideoBlock, 
  NotionPage,
  NotionDatabase,
  CreatePageRequest,
  AppendBlockChildrenRequest,
  MessageType 
} from '../types';

/**
 * 添加多个图片块到Notion页面
 */
export async function addMultipleImageBlocksToNotion(
  notionToken: string, 
  pageId: string, 
  imageUrls: string[], 
  caption: string = ""
): Promise<any> {
  try {
    console.log(`添加${imageUrls.length}个图片块到Notion页面: ${pageId}`);
    console.log(`图片URL列表: ${JSON.stringify(imageUrls)}`);
    
    if (!imageUrls || imageUrls.length === 0) {
      console.error("没有图片URL可添加");
      return null;
    }
    
    if (!pageId) {
      console.error("未提供有效的页面ID");
      return null;
    }

    const imageBlocks: NotionImageBlock[] = imageUrls
      .filter(imageUrl => imageUrl)
      .map(imageUrl => ({
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: {
            url: imageUrl
          }
        }
      }));

    if (imageBlocks.length === 0) {
      console.error("没有有效的图片块可添加");
      return null;
    }

    console.log(`构建了 ${imageBlocks.length} 个图片块，准备发送请求...`);
    
    const requestBody: AppendBlockChildrenRequest = {
      children: imageBlocks
    };

    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log(`Notion响应: ${responseText}`);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error("添加多个图片块失败:", errorData);
      throw new Error(`添加多个图片块失败: ${errorData.message || "未知错误"}`);
    }

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("解析响应JSON失败:", e);
      throw new Error(`解析响应JSON失败: ${(e as Error).message}`);
    }

    console.log("多个图片块添加成功!");
    return result;
  } catch (error) {
    console.error("添加多个图片块时出错:", error);
    console.error("错误堆栈:", (error as Error).stack);
    return null;
  }
}

/**
 * 添加多个视频块到Notion页面
 */
export async function addMultipleVideoBlocksToNotion(
  notionToken: string, 
  pageId: string, 
  videoUrls: string[], 
  caption: string = ""
): Promise<any> {
  try {
    console.log(`添加${videoUrls.length}个视频块到Notion页面: ${pageId}`);
    console.log(`视频URL列表: ${JSON.stringify(videoUrls)}`);
    
    if (!videoUrls || videoUrls.length === 0) {
      console.error("没有视频URL可添加");
      return null;
    }
    
    if (!pageId) {
      console.error("未提供有效的页面ID");
      return null;
    }

    const videoBlocks: NotionVideoBlock[] = videoUrls
      .filter(videoUrl => videoUrl)
      .map(videoUrl => ({
        object: "block",
        type: "video",
        video: {
          type: "external",
          external: {
            url: videoUrl
          }
        }
      }));

    if (videoBlocks.length === 0) {
      console.error("没有有效的视频块可添加");
      return null;
    }

    console.log(`构建了 ${videoBlocks.length} 个视频块，准备发送请求...`);
    
    const requestBody: AppendBlockChildrenRequest = {
      children: videoBlocks
    };

    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log(`Notion响应: ${responseText}`);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error("添加多个视频块失败:", errorData);
      throw new Error(`添加多个视频块失败: ${errorData.message || "未知错误"}`);
    }

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("解析响应JSON失败:", e);
      throw new Error(`解析响应JSON失败: ${(e as Error).message}`);
    }

    console.log("多个视频块添加成功!");
    return result;
  } catch (error) {
    console.error("添加多个视频块时出错:", error);
    console.error("错误堆栈:", (error as Error).stack);
    return null;
  }
}

/**
 * 添加消息到Notion数据库
 */
export async function addMessageToNotion(
  notionToken: string,
  databaseId: string,
  message: string,
  source: string = "Telegram",
  messageId: number,
  messageType: MessageType = "文本",
  channelUsername: string,
  imageUrls: string[] = [],
  videoUrls: string[] = [],
  fileUrls: string[] = []
): Promise<string | false> {
  try {
    console.log(`尝试添加消息到 Notion: "${message}", 类型: ${messageType}`);
    console.log(`使用数据库 ID: ${databaseId}`);

    if (imageUrls.length > 0) {
      console.log(`消息包含 ${imageUrls.length} 张图片`);
    }
    if (videoUrls.length > 0) {
      console.log(`消息包含 ${videoUrls.length} 个视频`);
    }
    if (fileUrls.length > 0) {
      console.log(`消息包含 ${fileUrls.length} 个文件`);
    }

    // 验证数据库访问权限
    try {
      console.log("正在查询数据库...");
      const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      });

      if (!databaseResponse.ok) {
        const errorData: any = await databaseResponse.json();
        console.error("查询数据库失败:", errorData);
        throw new Error(`查询数据库失败: ${errorData.message || "未知错误"}`);
      }

      const database: NotionDatabase = await databaseResponse.json();
      console.log("数据库查询成功!");
      console.log("数据库属性:", Object.keys(database.properties));
    } catch (dbError) {
      console.error("查询数据库失败:", dbError);
      throw dbError;
    }

    // 构建页面属性
    const properties: any = {
      // 内容 - 标题类型
      "内容": {
        title: [
          {
            text: {
              content: message
            }
          }
        ]
      },
      // 创建日期 - 日期时间类型
      "创建日期": {
        date: {
          start: new Date().toISOString().slice(0, 16) // 格式：YYYY-MM-DDTHH:MM
        }
      }
    };

    // 确定消息类型
    let displayMessageType = messageType;
    if (imageUrls && imageUrls.length > 0) {
      displayMessageType = "图片";
    }
    if (videoUrls && videoUrls.length > 0) {
      displayMessageType = "视频";
    }
    if (fileUrls && fileUrls.length > 0) {
      displayMessageType = "文件";
    }

    properties["消息类型"] = {
      select: {
        name: displayMessageType
      }
    };

    // 添加消息链接
    if (channelUsername && messageId) {
      properties["消息链接"] = {
        url: `https://t.me/${channelUsername}/${messageId}`
      };
    }

    // 添加文件属性
    if (imageUrls && imageUrls.length > 0) {
      properties["图片"] = {
        files: imageUrls.map((url) => ({
          type: "external",
          name: "图片",
          external: { url }
        }))
      };
    }

    if (videoUrls && videoUrls.length > 0) {
      properties["视频"] = {
        files: videoUrls.map((url) => ({
          type: "external",
          name: "视频",
          external: { url }
        }))
      };
    }

    if (fileUrls && fileUrls.length > 0) {
      properties["文件"] = {
        files: fileUrls.map((url) => ({
          type: "external",
          name: "文件",
          external: { url }
        }))
      };
    }

    const createPageRequest: CreatePageRequest = {
      parent: { database_id: databaseId },
      properties
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createPageRequest)
    });

    if (!response.ok) {
      const errorData: any = await response.json();
      console.error("添加消息到 Notion 失败:", errorData);
      throw new Error(`添加消息失败: ${errorData.message || "未知错误"}`);
    }

    const result: NotionPage = await response.json();
    console.log("消息添加成功! 页面 ID:", result.id);

    // 添加图片块
    if (imageUrls && imageUrls.length > 0) {
      console.log(`正在添加 ${imageUrls.length} 张图片到页面...`);
      try {
        console.log(`图片URL列表: ${JSON.stringify(imageUrls)}`);
        const imageResult = await addMultipleImageBlocksToNotion(notionToken, result.id, imageUrls);
        if (imageResult) {
          console.log(`图片块添加成功!`);
        } else {
          console.error(`图片块添加失败!`);
        }
      } catch (imageError) {
        console.error(`添加图片块时出错:`, imageError);
      }
    }

    // 添加视频块
    if (videoUrls && videoUrls.length > 0) {
      console.log(`正在添加 ${videoUrls.length} 个视频到页面...`);
      try {
        console.log(`视频URL列表: ${JSON.stringify(videoUrls)}`);
        const videoResult = await addMultipleVideoBlocksToNotion(notionToken, result.id, videoUrls);
        if (videoResult) {
          console.log(`视频块添加成功!`);
        } else {
          console.error(`视频块添加失败!`);
        }
      } catch (videoError) {
        console.error(`添加视频块时出错:`, videoError);
      }
    }

    return result.id;
  } catch (error) {
    console.error("添加消息到 Notion 失败:", error);
    if ((error as any).code) {
      console.error("错误代码:", (error as any).code);
      console.error("错误消息:", (error as Error).message);
    }
    if ((error as any).body) {
      console.error("错误详情:", JSON.stringify((error as any).body));
    }
    return false;
  }
}
