var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/fixed.ts
var mediaGroupMap = /* @__PURE__ */ new Map();
var MEDIA_GROUP_EXPIRY = 12 * 60 * 60 * 1e3;
function getMediaGroupInfo(mediaGroupId) {
  const now = Date.now();
  for (const [id, info] of mediaGroupMap.entries()) {
    if (now - info.timestamp > MEDIA_GROUP_EXPIRY) {
      mediaGroupMap.delete(id);
    }
  }
  return mediaGroupMap.get(mediaGroupId) || null;
}
__name(getMediaGroupInfo, "getMediaGroupInfo");
function saveMediaGroupInfo(mediaGroupId, info) {
  mediaGroupMap.set(mediaGroupId, info);
}
__name(saveMediaGroupInfo, "saveMediaGroupInfo");
async function getFileInfo(botToken, fileId) {
  try {
    console.log(`\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F: ${fileId}`);
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error("\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u5931\u8D25:", errorData);

      // 提取 Telegram API 的错误信息
      const telegramError = errorData.description || errorData.message || "\u672A\u77E5\u9519\u8BEF";
      console.error("Telegram API \u9519\u8BEF:", telegramError);

      throw new Error(`\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u5931\u8D25: ${telegramError}`);
    }
    const result = await response.json();
    console.log("\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u6210\u529F:", JSON.stringify(result));
    if (!result.ok || !result.result || !result.result.file_path) {
      throw new Error("\u65E0\u6548\u7684\u6587\u4EF6\u4FE1\u606F\u54CD\u5E94");
    }
    return result.result.file_path;
  } catch (error) {
    console.error("\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u65F6\u51FA\u9519:", error);
    throw error;
  }
}
__name(getFileInfo, "getFileInfo");
async function getFileUrl(workerDomain, fileId, botToken = null) {
  // 如果有 botToken，尝试获取真实的文件扩展名
  if (botToken) {
    try {
      const filePath = await getFileInfo(botToken, fileId);
      if (filePath) {
        // 从文件路径提取文件名 (例如: "photos/file_137.jpg" -> "file_137.jpg")
        const pathParts = filePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return `${workerDomain}/file/${fileId}/${fileName}`;
      }
    } catch (error) {
      console.log(`无法获取文件信息，使用默认文件名: ${error.message}`);
    }
  }

  // 默认使用 image.jpg 作为文件名
  return `${workerDomain}/file/${fileId}/image.jpg`;
}

// 保持向后兼容的同步版本
function getFileUrlSync(workerDomain, fileId) {
  return `${workerDomain}/file/${fileId}/image.jpg`;
}

// 智能获取文件URL，根据文件类型生成正确的扩展名
async function getSmartFileUrl(workerDomain, fileId, botToken, fileType = 'image') {
  try {
    // 从 Telegram API 获取真实的文件路径
    const filePath = await getFileInfo(botToken, fileId);
    if (filePath) {
      // 从文件路径提取文件名 (例如: "photos/file_137.jpg" -> "file_137.jpg")
      const pathParts = filePath.split('/');
      let fileName = pathParts[pathParts.length - 1];

      // 检查文件名是否包含扩展名
      if (fileName.includes('.')) {
        // 智能修正文件扩展名，但保留图片文件的原始扩展名
        if (fileType === 'video' && !fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
          // 保留文件名但改为视频扩展名
          const nameWithoutExt = fileName.split('.')[0];
          fileName = `${nameWithoutExt}.mp4`;
        }
        else if (fileType === 'document' && !fileName.match(/\.(pdf|doc|docx|txt|zip|rar|jpg|jpeg|png|gif|webp)$/i)) {
          // 只有当文件不是图片格式时，才改为文档扩展名
          const nameWithoutExt = fileName.split('.')[0];
          fileName = `${nameWithoutExt}.pdf`;
        }
        else if (fileType === 'audio' && !fileName.match(/\.(mp3|wav|flac|aac|ogg)$/i)) {
          // 保留文件名但改为音频扩展名
          const nameWithoutExt = fileName.split('.')[0];
          fileName = `${nameWithoutExt}.mp3`;
        }
        // 对于图片类型，保持原始扩展名不变

        return `${workerDomain}/file/${fileId}/${fileName}`;
      } else {
        // 如果没有扩展名，根据文件类型添加
        let extension;
        switch (fileType) {
          case 'video':
            extension = '.mp4';
            break;
          case 'document':
            extension = '.pdf';
            break;
          case 'audio':
            extension = '.mp3';
            break;
          case 'image':
          default:
            extension = '.jpg';
            break;
        }
        return `${workerDomain}/file/${fileId}/${fileName}${extension}`;
      }
    }
  } catch (error) {
    console.log(`无法获取文件信息，使用默认文件名: ${error.message}`);
  }

  // 如果无法获取真实文件名，根据文件类型生成默认文件名
  let defaultFileName;
  switch (fileType) {
    case 'video':
      defaultFileName = 'video.mp4';
      break;
    case 'document':
      defaultFileName = 'document.pdf';
      break;
    case 'audio':
      defaultFileName = 'audio.mp3';
      break;
    case 'image':
    default:
      defaultFileName = 'image.jpg';
      break;
  }

  return `${workerDomain}/file/${fileId}/${defaultFileName}`;
}
function getTelegramFileUrl(botToken, filePath) {
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}
__name(getFileUrl, "getFileUrl");
async function addMultipleImageBlocksToNotion(notionToken, pageId, imageUrls, caption = "") {
  try {
    console.log(`\u6DFB\u52A0${imageUrls.length}\u4E2A\u56FE\u7247\u5757\u5230Notion\u9875\u9762: ${pageId}`);
    console.log(`\u56FE\u7247URL\u5217\u8868: ${JSON.stringify(imageUrls)}`);
    if (!imageUrls || imageUrls.length === 0) {
      console.error("\u6CA1\u6709\u56FE\u7247URL\u53EF\u6DFB\u52A0");
      return null;
    }
    if (!pageId) {
      console.error("\u672A\u63D0\u4F9B\u6709\u6548\u7684\u9875\u9762ID");
      return null;
    }
    const imageBlocks = imageUrls.map((imageUrl) => {
      if (!imageUrl) {
        console.error("\u53D1\u73B0\u7A7A\u7684\u56FE\u7247URL");
        return null;
      }
      return {
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: {
            url: imageUrl
          }
        }
      };
    }).filter((block) => block !== null);
    if (imageBlocks.length === 0) {
      console.error("\u6CA1\u6709\u6709\u6548\u7684\u56FE\u7247\u5757\u53EF\u6DFB\u52A0");
      return null;
    }
    console.log(`\u6784\u5EFA\u4E86 ${imageBlocks.length} \u4E2A\u56FE\u7247\u5757\uFF0C\u51C6\u5907\u53D1\u9001\u8BF7\u6C42...`);
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        children: imageBlocks
      })
    });
    const responseText = await response.text();
    console.log(`Notion\u54CD\u5E94: ${responseText}`);
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error("\u6DFB\u52A0\u591A\u4E2A\u56FE\u7247\u5757\u5931\u8D25:", errorData);
      throw new Error(`\u6DFB\u52A0\u591A\u4E2A\u56FE\u7247\u5757\u5931\u8D25: ${errorData.message || "\u672A\u77E5\u9519\u8BEF"}`);
    }
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("\u89E3\u6790\u54CD\u5E94JSON\u5931\u8D25:", e);
      throw new Error(`\u89E3\u6790\u54CD\u5E94JSON\u5931\u8D25: ${e.message}`);
    }
    console.log("\u591A\u4E2A\u56FE\u7247\u5757\u6DFB\u52A0\u6210\u529F!");
    return result;
  } catch (error) {
    console.error("\u6DFB\u52A0\u591A\u4E2A\u56FE\u7247\u5757\u65F6\u51FA\u9519:", error);
    console.error("\u9519\u8BEF\u5806\u6808:", error.stack);
    return null;
  }
}
__name(addMultipleImageBlocksToNotion, "addMultipleImageBlocksToNotion");
async function addMultipleVideoBlocksToNotion(notionToken, pageId, videoUrls, caption = "") {
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
    const videoBlocks = videoUrls.map((videoUrl) => {
      if (!videoUrl) {
        console.error("发现空的视频URL");
        return null;
      }
      return {
        object: "block",
        type: "video",
        video: {
          type: "external",
          external: {
            url: videoUrl
          }
        }
      };
    }).filter((block) => block !== null);
    if (videoBlocks.length === 0) {
      console.error("没有有效的视频块可添加");
      return null;
    }
    console.log(`构建了 ${videoBlocks.length} 个视频块，准备发送请求...`);
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        children: videoBlocks
      })
    });
    const responseText = await response.text();
    console.log(`Notion响应: ${responseText}`);
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error("添加多个视频块失败:", errorData);
      throw new Error(`添加多个视频块失败: ${errorData.message || "未知错误"}`);
    }
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("解析响应JSON失败:", e);
      throw new Error(`解析响应JSON失败: ${e.message}`);
    }
    console.log("多个视频块添加成功!");
    return result;
  } catch (error) {
    console.error("添加多个视频块时出错:", error);
    console.error("错误堆栈:", error.stack);
    return null;
  }
}
__name(addMultipleVideoBlocksToNotion, "addMultipleVideoBlocksToNotion");
async function addMessageToNotion(notionToken, databaseId, message, source = "Telegram", messageId, messageType = "\u6587\u672C", channelUsername, imageUrls = [], videoUrls = [], fileUrls = []) {
  try {
    console.log(`\u5C1D\u8BD5\u6DFB\u52A0\u6D88\u606F\u5230 Notion: "${message}", \u7C7B\u578B: ${messageType}`);
    console.log(`\u4F7F\u7528\u6570\u636E\u5E93 ID: ${databaseId}`);
    if (imageUrls.length > 0) {
      console.log(`\u6D88\u606F\u5305\u542B ${imageUrls.length} \u5F20\u56FE\u7247`);
    }
    if (videoUrls.length > 0) {
      console.log(`\u6D88\u606F\u5305\u542B ${videoUrls.length} \u4E2A\u89C6\u9891`);
    }
    if (fileUrls.length > 0) {
      console.log(`\u6D88\u606F\u5305\u542B ${fileUrls.length} \u4E2A\u6587\u4EF6`);
    }
    try {
      console.log("\u6B63\u5728\u67E5\u8BE2\u6570\u636E\u5E93...");
      const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      });
      if (!databaseResponse.ok) {
        const errorData = await databaseResponse.json();
        console.error("\u67E5\u8BE2\u6570\u636E\u5E93\u5931\u8D25:", errorData);
        throw new Error(`\u67E5\u8BE2\u6570\u636E\u5E93\u5931\u8D25: ${errorData.message || "\u672A\u77E5\u9519\u8BEF"}`);
      }
      const database = await databaseResponse.json();
      console.log("\u6570\u636E\u5E93\u67E5\u8BE2\u6210\u529F!");
      console.log("\u6570\u636E\u5E93\u5C5E\u6027:", Object.keys(database.properties));
    } catch (dbError) {
      console.error("\u67E5\u8BE2\u6570\u636E\u5E93\u5931\u8D25:", dbError);
      throw dbError;
    }
    const properties = {
      // 内容 - 标题类型
      "\u5185\u5BB9": {
        title: [
          {
            text: {
              content: message
            }
          }
        ]
      },
      // 创建日期 - 日期时间类型
      "\u521B\u5EFA\u65E5\u671F": {
        date: {
          start: new Date().toISOString().slice(0, 16) // 格式：YYYY-MM-DDTHH:MM
        }
      }
    };
    let displayMessageType = messageType;
    if (imageUrls && imageUrls.length > 0) {
      displayMessageType = "\u56FE\u7247";
    }
    if (videoUrls && videoUrls.length > 0) {
      displayMessageType = "\u89C6\u9891";
    }
    if (fileUrls && fileUrls.length > 0) {
      displayMessageType = "\u6587\u4EF6";
    }
    properties["\u6D88\u606F\u7C7B\u578B"] = {
      select: {
        name: displayMessageType
      }
    };
    if (channelUsername && messageId) {
      properties["\u6D88\u606F\u94FE\u63A5"] = {
        url: `https://t.me/${channelUsername}/${messageId}`
      };
    }
    if (imageUrls && imageUrls.length > 0) {
      properties["\u56FE\u7247"] = {
        files: imageUrls.map((url) => ({
          type: "external",
          name: "\u56FE\u7247",
          external: { url }
        }))
      };
    }
    if (videoUrls && videoUrls.length > 0) {
      properties["\u89C6\u9891"] = {
        files: videoUrls.map((url) => ({
          type: "external",
          name: "\u89C6\u9891",
          external: { url }
        }))
      };
    }
    if (fileUrls && fileUrls.length > 0) {
      properties["\u6587\u4EF6"] = {
        files: fileUrls.map((url) => ({
          type: "external",
          name: "\u6587\u4EF6",
          external: { url }
        }))
      };
    }
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("\u6DFB\u52A0\u6D88\u606F\u5230 Notion \u5931\u8D25:", errorData);
      throw new Error(`\u6DFB\u52A0\u6D88\u606F\u5931\u8D25: ${errorData.message || "\u672A\u77E5\u9519\u8BEF"}`);
    }
    const result = await response.json();
    console.log("\u6D88\u606F\u6DFB\u52A0\u6210\u529F! \u9875\u9762 ID:", result.id);
    if (imageUrls && imageUrls.length > 0) {
      console.log(`\u6B63\u5728\u6DFB\u52A0 ${imageUrls.length} \u5F20\u56FE\u7247\u5230\u9875\u9762...`);
      try {
        console.log(`\u56FE\u7247URL\u5217\u8868: ${JSON.stringify(imageUrls)}`);
        const imageResult = await addMultipleImageBlocksToNotion(notionToken, result.id, imageUrls);
        if (imageResult) {
          console.log(`\u56FE\u7247\u5757\u6DFB\u52A0\u6210\u529F!`);
        } else {
          console.error(`\u56FE\u7247\u5757\u6DFB\u52A0\u5931\u8D25!`);
        }
      } catch (imageError) {
        console.error(`\u6DFB\u52A0\u56FE\u7247\u5757\u65F6\u51FA\u9519:`, imageError);
      }
    }
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
    console.error("\u6DFB\u52A0\u6D88\u606F\u5230 Notion \u5931\u8D25:", error);
    if (error.code) {
      console.error("\u9519\u8BEF\u4EE3\u7801:", error.code);
      console.error("\u9519\u8BEF\u6D88\u606F:", error.message);
    }
    if (error.body) {
      console.error("\u9519\u8BEF\u8BE6\u60C5:", JSON.stringify(error.body));
    }
    return false;
  }
}
__name(addMessageToNotion, "addMessageToNotion");
var fixed_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log(`\u6536\u5230\u8BF7\u6C42: ${request.method} ${path}`);
    const notionToken = env.NOTION_TOKEN || "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";
    const notionDatabaseId = env.NOTION_DATABASE_ID || "1fe3eb3c2d55802fa90ddb8a0b2d44bb";
    const telegramBotToken = env.TELEGRAM_BOT_TOKEN || "7515858617:AAGUVvGxW9fXpZqLKQoiZFvj5BgmQlkfcSE";
    console.log(`\u4F7F\u7528 Notion \u4EE4\u724C: ${notionToken.substring(0, 10)}...`);
    console.log(`\u4F7F\u7528\u6570\u636E\u5E93 ID: ${notionDatabaseId}`);
    console.log(`\u4F7F\u7528 Telegram Bot \u4EE4\u724C: ${telegramBotToken.substring(0, 10)}...`);
    if (path === "/" || path === "") {
      return new Response("Telegram Bot to Notion \u96C6\u6210\u670D\u52A1\u6B63\u5728\u8FD0\u884C!", {
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      });
    }
    if (path === "/test-notion") {
      try {
        console.log("\u5F00\u59CB\u6D4B\u8BD5 Notion API \u96C6\u6210...");
        const testMessage = "\u6D4B\u8BD5\u6D88\u606F - " + (/* @__PURE__ */ new Date()).toISOString();
        console.log(`\u6B63\u5728\u6DFB\u52A0\u6D4B\u8BD5\u6D88\u606F: "${testMessage}"`);
        try {
          console.log("\u5C1D\u8BD5\u6700\u7B80\u5355\u7684 Notion API \u8BF7\u6C42...");
          const simpleResponse = await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${notionToken}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              parent: { database_id: notionDatabaseId },
              properties: {
                "\u5185\u5BB9": {
                  title: [
                    {
                      text: {
                        content: "\u7B80\u5355\u6D4B\u8BD5 - " + (/* @__PURE__ */ new Date()).toISOString()
                      }
                    }
                  ]
                }
              }
            })
          });
          if (!simpleResponse.ok) {
            const errorData = await simpleResponse.json();
            throw new Error(`\u7B80\u5355\u8BF7\u6C42\u5931\u8D25: ${errorData.message || "\u672A\u77E5\u9519\u8BEF"}`);
          }
          const simpleResult = await simpleResponse.json();
          console.log("\u7B80\u5355 Notion \u8BF7\u6C42\u6210\u529F! \u9875\u9762 ID:", simpleResult.id);
          const success = await addMessageToNotion(
            notionToken,
            notionDatabaseId,
            testMessage,
            "\u6D4B\u8BD5",
            Math.floor(Date.now() / 1e3),
            "\u6D4B\u8BD5",
            "blurmood",
            // 使用您的机器人用户名作为测试
            [],
            [],
            []
          );
          console.log(`\u6D4B\u8BD5\u7ED3\u679C: ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
          return new Response(JSON.stringify({
            success,
            message: success ? "\u6210\u529F\u6DFB\u52A0\u6D4B\u8BD5\u6D88\u606F\u5230 Notion" : "\u6DFB\u52A0\u6D88\u606F\u5931\u8D25"
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (simpleError) {
          console.error("\u7B80\u5355 Notion \u8BF7\u6C42\u5931\u8D25:", simpleError);
          return new Response(JSON.stringify({
            success: false,
            error: simpleError.message,
            stack: simpleError.stack
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch (error) {
        console.error("\u6D4B\u8BD5 Notion \u8FDE\u63A5\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (path === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        console.log("\u6536\u5230 Telegram \u66F4\u65B0:", JSON.stringify(update));
        if (update.channel_post) {
          const channelPost = update.channel_post;
          const messageId = channelPost.message_id;
          const chatTitle = channelPost.chat.title || "\u672A\u77E5\u9891\u9053";
          const channelUsername = channelPost.chat.username;
          let messageContent = "";
          let messageType = "\u6587\u672C";
          let imageUrls = [];
          let videoUrls = [];
          let fileUrls = [];
          if (channelPost.text) {
            messageContent = channelPost.text;
            messageType = "\u6587\u672C";
          } else if (channelPost.photo) {
            messageContent = channelPost.caption || "\u56FE\u7247\u6D88\u606F";
            messageType = "\u56FE\u7247";
            try {
              const photos = channelPost.photo;
              console.log(`\u6536\u5230 ${photos.length} \u5F20\u56FE\u7247`);
              for (const photo of photos) {
                try {
                  if (photo === photos[photos.length - 1]) {
                    const fileUrl = await getSmartFileUrl(url.origin, photo.file_id, telegramBotToken, 'image');
                    imageUrls.push(fileUrl);
                    console.log(`\u5DF2\u6DFB\u52A0\u56FE\u7247URL: ${fileUrl}`);
                  }
                } catch (photoError) {
                  console.error(`\u5904\u7406\u56FE\u7247\u65F6\u51FA\u9519:`, photoError);
                }
              }
            } catch (photosError) {
              console.error(`\u5904\u7406\u56FE\u7247\u96C6\u5408\u65F6\u51FA\u9519:`, photosError);
            }
          } else if (channelPost.video) {
            messageContent = channelPost.caption || "\u89C6\u9891\u6D88\u606F";
            messageType = "\u89C6\u9891";
            try {
              const fileUrl = await getSmartFileUrl(url.origin, channelPost.video.file_id, telegramBotToken, 'video');
              videoUrls.push(fileUrl);
              console.log(`\u5DF2\u6DFB\u52A0\u89C6\u9891URL: ${fileUrl}`);
            } catch (videoError) {
              console.error(`\u5904\u7406\u89C6\u9891\u65F6\u51FA\u9519:`, videoError);
            }
          } else if (channelPost.document) {
            const mimeType = channelPost.document.mime_type;
            const fileName = channelPost.document.file_name || "\u672A\u77E5\u6587\u4EF6";

            // 检查是否是图片文档（转发的图片通常会变成document类型）
            if (mimeType && mimeType.startsWith('image/')) {
              console.log(`\u68C0\u6D4B\u5230\u56FE\u7247\u6587\u6863: ${fileName}, MIME\u7C7B\u578B: ${mimeType}`);
              // 优先使用消息的文本内容，如果没有才使用文件名
              messageContent = channelPost.caption || channelPost.text || `\u56FE\u7247: ${fileName}`;
              messageType = "\u56FE\u7247";
              console.log(`\u56FE\u7247\u6587\u6863\u6D88\u606F\u5185\u5BB9: ${messageContent}`);
              try {
                const fileUrl = await getSmartFileUrl(url.origin, channelPost.document.file_id, telegramBotToken, 'image');
                imageUrls.push(fileUrl);
                console.log(`\u5DF2\u6DFB\u52A0\u56FE\u7247URL\uFF08\u6765\u81EA\u6587\u6863\uFF09: ${fileUrl}`);
              } catch (imageError) {
                console.error(`\u5904\u7406\u56FE\u7247\u6587\u6863\u65F6\u51FA\u9519:`, imageError);
              }
            } else {
              // 真正的文档文件
              console.log(`\u68C0\u6D4B\u5230\u6587\u6863\u6587\u4EF6: ${fileName}, MIME\u7C7B\u578B: ${mimeType}`);
              // 优先使用消息的文本内容，如果没有才使用文件名
              messageContent = channelPost.caption || channelPost.text || fileName;
              messageType = "\u6587\u4EF6";
              console.log(`\u6587\u6863\u6587\u4EF6\u6D88\u606F\u5185\u5BB9: ${messageContent}`);
              try {
                const fileUrl = await getSmartFileUrl(url.origin, channelPost.document.file_id, telegramBotToken, 'document');
                fileUrls.push(fileUrl);
                console.log(`\u5DF2\u6DFB\u52A0\u6587\u4EF6URL: ${fileUrl}`);
              } catch (fileError) {
                console.error(`\u5904\u7406\u6587\u4EF6\u65F6\u51FA\u9519:`, fileError);
              }
            }
          } else if (channelPost.audio) {
            messageContent = channelPost.caption || channelPost.audio.title || "\u97F3\u9891\u6D88\u606F";
            messageType = "\u97F3\u9891";
          } else if (channelPost.voice) {
            messageContent = channelPost.caption || "\u8BED\u97F3\u6D88\u606F";
            messageType = "\u8BED\u97F3";
          } else if (channelPost.sticker) {
            messageContent = channelPost.sticker.emoji || "\u8D34\u7EB8\u6D88\u606F";
            messageType = "\u8D34\u7EB8";
          } else {
            messageContent = "\u672A\u77E5\u7C7B\u578B\u6D88\u606F";
            messageType = "\u5176\u4ED6";
          }
          console.log(`\u6536\u5230\u9891\u9053\u6D88\u606F ID: ${messageId}, \u7C7B\u578B: ${messageType}, \u5185\u5BB9: ${messageContent} \u6765\u81EA ${chatTitle}`);
          if (imageUrls.length > 0) {
            console.log(`\u6D88\u606F\u5305\u542B ${imageUrls.length} \u5F20\u56FE\u7247`);
          }
          if (videoUrls.length > 0) {
            console.log(`\u6D88\u606F\u5305\u542B ${videoUrls.length} \u4E2A\u89C6\u9891`);
          }
          if (fileUrls.length > 0) {
            console.log(`\u6D88\u606F\u5305\u542B ${fileUrls.length} \u4E2A\u6587\u4EF6`);
          }
          if (channelPost.media_group_id) {
            const mediaGroupId = channelPost.media_group_id;
            console.log(`\u68C0\u6D4B\u5230\u5A92\u4F53\u7EC4\u6D88\u606F\uFF0C\u7EC4ID: ${mediaGroupId}`);
            if (channelPost.photo && imageUrls.length === 0) {
              try {
                const photos = channelPost.photo;
                const photo = photos[photos.length - 1];
                const fileUrl = await getSmartFileUrl(url.origin, photo.file_id, telegramBotToken, 'image');
                imageUrls.push(fileUrl);
                console.log(`\u5DF2\u6DFB\u52A0\u5A92\u4F53\u7EC4\u56FE\u7247URL: ${fileUrl}`);
              } catch (mediaGroupError) {
                console.error(`\u5904\u7406\u5A92\u4F53\u7EC4\u56FE\u7247\u65F6\u51FA\u9519:`, mediaGroupError);
              }
            }
            const existingGroup = getMediaGroupInfo(mediaGroupId);
            if (existingGroup) {
              console.log(`\u627E\u5230\u5DF2\u5B58\u5728\u7684\u5A92\u4F53\u7EC4\u8BB0\u5F55\uFF0C\u9875\u9762ID: ${existingGroup.pageId}`);
              if (imageUrls && imageUrls.length > 0) {
                const allImageUrls = [...existingGroup.imageUrls || [], ...imageUrls];
                existingGroup.imageUrls = allImageUrls;
                existingGroup.timestamp = Date.now();
                saveMediaGroupInfo(mediaGroupId, existingGroup);
                console.log(`\u6DFB\u52A0 ${imageUrls.length} \u5F20\u65B0\u56FE\u7247\u5230\u73B0\u6709\u9875\u9762: ${existingGroup.pageId}`);
                await addMultipleImageBlocksToNotion(notionToken, existingGroup.pageId, imageUrls);
                try {
                  const imageProperties = {};
                  imageProperties["\u56FE\u7247"] = {
                    files: allImageUrls.map((url2) => ({
                      type: "external",
                      name: "\u56FE\u7247",
                      external: { url: url2 }
                    }))
                  };
                  await fetch(`https://api.notion.com/v1/pages/${existingGroup.pageId}`, {
                    method: "PATCH",
                    headers: {
                      "Authorization": `Bearer ${notionToken}`,
                      "Notion-Version": "2022-06-28",
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      properties: imageProperties
                    })
                  });
                  console.log(`\u66F4\u65B0\u4E86Notion\u9875\u9762\u7684\u56FE\u7247\u5C5E\u6027\uFF0C\u5305\u542B ${allImageUrls.length} \u5F20\u56FE\u7247`);
                } catch (updateImageError) {
                  console.error(`\u66F4\u65B0Notion\u9875\u9762\u56FE\u7247\u5C5E\u6027\u65F6\u51FA\u9519:`, updateImageError);
                }
              }
              if (videoUrls && videoUrls.length > 0) {
                const allVideoUrls = [...existingGroup.videoUrls || [], ...videoUrls];
                existingGroup.videoUrls = allVideoUrls;
                console.log(`\u66F4\u65B0\u5A92\u4F53\u7EC4\u89C6\u9891URLs\uFF0C\u73B0\u5728\u5171\u6709 ${allVideoUrls.length} \u4E2A\u89C6\u9891`);
                existingGroup.timestamp = Date.now();
                saveMediaGroupInfo(mediaGroupId, existingGroup);

                // 添加视频块到页面内容
                console.log(`\u6DFB\u52A0 ${videoUrls.length} \u4E2A\u65B0\u89C6\u9891\u5230\u73B0\u6709\u9875\u9762: ${existingGroup.pageId}`);
                await addMultipleVideoBlocksToNotion(notionToken, existingGroup.pageId, videoUrls);
              }
              if (fileUrls && fileUrls.length > 0) {
                const allFileUrls = [...existingGroup.fileUrls || [], ...fileUrls];
                existingGroup.fileUrls = allFileUrls;
                console.log(`\u66F4\u65B0\u5A92\u4F53\u7EC4\u6587\u4EF6URLs\uFF0C\u73B0\u5728\u5171\u6709 ${allFileUrls.length} \u4E2A\u6587\u4EF6`);
                existingGroup.timestamp = Date.now();
                saveMediaGroupInfo(mediaGroupId, existingGroup);
              }
              if (existingGroup.videoUrls && existingGroup.videoUrls.length > 0) {
                try {
                  const properties = {};
                  if (existingGroup.videoUrls && existingGroup.videoUrls.length > 0) {
                    properties["\u89C6\u9891"] = {
                      files: existingGroup.videoUrls.map((url2) => ({
                        type: "external",
                        name: "\u89C6\u9891",
                        external: { url: url2 }
                      }))
                    };
                  }
                  await fetch(`https://api.notion.com/v1/pages/${existingGroup.pageId}`, {
                    method: "PATCH",
                    headers: {
                      "Authorization": `Bearer ${notionToken}`,
                      "Notion-Version": "2022-06-28",
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      properties
                    })
                  });
                  console.log(`\u66F4\u65B0\u4E86Notion\u9875\u9762\u7684\u89C6\u9891\u5C5E\u6027`);
                } catch (updateError) {
                  console.error(`\u66F4\u65B0Notion\u9875\u9762\u89C6\u9891\u5C5E\u6027\u65F6\u51FA\u9519:`, updateError);
                }
              }
              if (existingGroup.fileUrls && existingGroup.fileUrls.length > 0) {
                try {
                  const properties = {};
                  if (existingGroup.fileUrls && existingGroup.fileUrls.length > 0) {
                    properties["\u6587\u4EF6"] = {
                      files: existingGroup.fileUrls.map((url2) => ({
                        type: "external",
                        name: "\u6587\u4EF6",
                        external: { url: url2 }
                      }))
                    };
                  }
                  await fetch(`https://api.notion.com/v1/pages/${existingGroup.pageId}`, {
                    method: "PATCH",
                    headers: {
                      "Authorization": `Bearer ${notionToken}`,
                      "Notion-Version": "2022-06-28",
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      properties
                    })
                  });
                  console.log(`\u66F4\u65B0\u4E86Notion\u9875\u9762\u7684\u6587\u4EF6\u5C5E\u6027`);
                } catch (updateError) {
                  console.error(`\u66F4\u65B0Notion\u9875\u9762\u6587\u4EF6\u5C5E\u6027\u65F6\u51FA\u9519:`, updateError);
                }
              }
              console.log(`\u5A92\u4F53\u7EC4\u5904\u7406\u5B8C\u6210\uFF0C\u73B0\u5728\u5171\u6709 ${existingGroup.imageUrls?.length || 0} \u5F20\u56FE\u7247\u3001${existingGroup.videoUrls?.length || 0} \u4E2A\u89C6\u9891\u548C ${existingGroup.fileUrls?.length || 0} \u4E2A\u6587\u4EF6`);
            } else {
              console.log(`\u4E3A\u5A92\u4F53\u7EC4\u521B\u5EFA\u65B0\u7684Notion\u9875\u9762`);
              // 调试：打印所有可能的文本字段
              console.log(`\u8C03\u8BD5 - channelPost.caption: ${channelPost.caption}`);
              console.log(`\u8C03\u8BD5 - channelPost.text: ${channelPost.text}`);
              console.log(`\u8C03\u8BD5 - channelPost \u5B8C\u6574\u7ED3\u6784:`, JSON.stringify(channelPost, null, 2));

              // 优先使用消息的文本内容，如果没有才使用默认的"媒体组消息"
              const content = channelPost.caption || channelPost.text || "\u5A92\u4F53\u7EC4\u6D88\u606F";
              console.log(`\u5A92\u4F53\u7EC4\u6D88\u606F\u5185\u5BB9: ${content}`);
              const pageId = await addMessageToNotion(
                notionToken,
                notionDatabaseId,
                content,
                `\u9891\u9053: ${chatTitle}`,
                messageId,
                "\u5A92\u4F53\u7EC4",
                // 媒体组类型会在addMessageToNotion中根据实际内容调整
                channelUsername,
                imageUrls,
                videoUrls,
                fileUrls
              );
              if (typeof pageId === "string") {
                const groupInfo = {
                  pageId,
                  timestamp: Date.now(),
                  imageUrls,
                  videoUrls,
                  fileUrls,
                  messageContent: content,
                  chatTitle
                };
                saveMediaGroupInfo(mediaGroupId, groupInfo);
                console.log(`\u5DF2\u521B\u5EFA\u5A92\u4F53\u7EC4\u8BB0\u5F55\uFF0C\u9875\u9762ID: ${pageId}`);
              } else {
                console.error(`\u521B\u5EFA\u5A92\u4F53\u7EC4Notion\u9875\u9762\u5931\u8D25`);
              }
            }
          } else {
            console.log(`\u5904\u7406\u666E\u901A\u6D88\u606F\uFF0C\u6DFB\u52A0\u5230Notion`);
            try {
              const result = await addMessageToNotion(
                notionToken,
                notionDatabaseId,
                messageContent,
                `\u9891\u9053: ${chatTitle}`,
                messageId,
                messageType,
                // 消息类型会在addMessageToNotion中根据实际内容调整
                channelUsername,
                imageUrls,
                videoUrls,
                fileUrls
              );
              console.log(`\u9891\u9053\u6D88\u606F\u540C\u6B65\u5230 Notion ${result ? "\u6210\u529F" : "\u5931\u8D25"}`);
            } catch (syncError) {
              console.error(`\u540C\u6B65\u9891\u9053\u6D88\u606F\u5230Notion\u65F6\u51FA\u9519:`, syncError);
            }
          }
        }
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("\u5904\u7406 Webhook \u9519\u8BEF:", error);
        return new Response("\u5904\u7406 Webhook \u9519\u8BEF", { status: 500 });
      }
    }
    if (path === "/test-image") {
      try {
        const testImageUrls = [
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg"
        ];
        const testMessage = "\u56FE\u7247\u6D4B\u8BD5\u6D88\u606F - " + (/* @__PURE__ */ new Date()).toISOString();
        console.log(`\u5F00\u59CB\u56FE\u7247\u6D4B\u8BD5\uFF0C\u4F7F\u7528\u56FE\u7247: ${JSON.stringify(testImageUrls)}`);
        const pageId = await addMessageToNotion(
          notionToken,
          notionDatabaseId,
          testMessage,
          "\u6D4B\u8BD5",
          Math.floor(Date.now() / 1e3),
          "\u6D4B\u8BD5",
          "test_channel",
          [testImageUrls[0]],
          // 先添加第一张图片
          [],
          []
        );
        let success = false;
        if (typeof pageId === "string") {
          console.log(`\u9875\u9762\u521B\u5EFA\u6210\u529F\uFF0CID: ${pageId}\uFF0C\u6DFB\u52A0\u7B2C\u4E8C\u5F20\u56FE\u7247...`);
          try {
            const imageResult = await addMultipleImageBlocksToNotion(notionToken, pageId, [testImageUrls[1]]);
            if (imageResult) {
              console.log(`\u7B2C\u4E8C\u5F20\u56FE\u7247\u6DFB\u52A0\u6210\u529F!`);
              success = true;
            } else {
              console.error(`\u7B2C\u4E8C\u5F20\u56FE\u7247\u6DFB\u52A0\u5931\u8D25!`);
            }
          } catch (secondImageError) {
            console.error(`\u6DFB\u52A0\u7B2C\u4E8C\u5F20\u56FE\u7247\u65F6\u51FA\u9519:`, secondImageError);
          }
        } else {
          console.error(`\u521B\u5EFA\u9875\u9762\u5931\u8D25\uFF0C\u65E0\u6CD5\u6DFB\u52A0\u56FE\u7247`);
        }
        return new Response(JSON.stringify({
          success,
          message: success ? "\u6210\u529F\u6DFB\u52A0\u591A\u5F20\u6D4B\u8BD5\u56FE\u7247\u5230 Notion" : "\u6DFB\u52A0\u56FE\u7247\u5931\u8D25",
          imageUrls: testImageUrls,
          pageId
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("\u6D4B\u8BD5\u56FE\u7247\u4E0A\u4F20\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (path === "/test-media-group") {
      try {
        const mediaGroupId = "test-media-group-" + Date.now();
        const testImages = [
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/1200px-Juvenile_Ragdoll.jpg"
        ];
        console.log(`\u6A21\u62DF\u7B2C\u4E00\u6761\u5A92\u4F53\u7EC4\u6D88\u606F`);
        const pageId = await addMessageToNotion(
          notionToken,
          notionDatabaseId,
          "\u6D4B\u8BD5\u5A92\u4F53\u7EC4\u6D88\u606F - " + (/* @__PURE__ */ new Date()).toISOString(),
          "\u6D4B\u8BD5",
          Math.floor(Date.now() / 1e3),
          "\u6D4B\u8BD5",
          "test_channel",
          [testImages[0]],
          [],
          []
        );
        if (typeof pageId !== "string") {
          throw new Error("\u521B\u5EFA\u5A92\u4F53\u7EC4\u9875\u9762\u5931\u8D25");
        }
        const groupInfo = {
          pageId,
          timestamp: Date.now(),
          imageUrls: [testImages[0]],
          videoUrls: [],
          fileUrls: [],
          messageContent: "\u6D4B\u8BD5\u5A92\u4F53\u7EC4\u6D88\u606F",
          chatTitle: "\u6D4B\u8BD5\u9891\u9053"
        };
        saveMediaGroupInfo(mediaGroupId, groupInfo);
        console.log(`\u6A21\u62DF\u7B2C\u4E8C\u6761\u548C\u7B2C\u4E09\u6761\u5A92\u4F53\u7EC4\u6D88\u606F`);
        const existingGroup = getMediaGroupInfo(mediaGroupId);
        if (!existingGroup) {
          throw new Error("\u83B7\u53D6\u5A92\u4F53\u7EC4\u4FE1\u606F\u5931\u8D25");
        }
        const newImages = [testImages[1], testImages[2]];
        const allImageUrls = [...existingGroup.imageUrls, ...newImages];
        existingGroup.imageUrls = allImageUrls;
        existingGroup.timestamp = Date.now();
        saveMediaGroupInfo(mediaGroupId, existingGroup);
        await addMultipleImageBlocksToNotion(notionToken, existingGroup.pageId, newImages);
        try {
          const imageProperties = {};
          imageProperties["\u56FE\u7247"] = {
            files: allImageUrls.map((url2) => ({
              type: "external",
              name: "\u56FE\u7247",
              external: { url: url2 }
            }))
          };
          await fetch(`https://api.notion.com/v1/pages/${existingGroup.pageId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${notionToken}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              properties: imageProperties
            })
          });
          console.log(`\u66F4\u65B0\u4E86\u6D4B\u8BD5Notion\u9875\u9762\u7684\u56FE\u7247\u5C5E\u6027\uFF0C\u5305\u542B ${allImageUrls.length} \u5F20\u56FE\u7247`);
        } catch (updateImageError) {
          console.error(`\u66F4\u65B0\u6D4B\u8BD5Notion\u9875\u9762\u56FE\u7247\u5C5E\u6027\u65F6\u51FA\u9519:`, updateImageError);
        }
        return new Response(JSON.stringify({
          success: true,
          message: "\u6210\u529F\u6D4B\u8BD5\u5A92\u4F53\u7EC4\u529F\u80FD",
          mediaGroupId,
          pageId: existingGroup.pageId,
          imageUrls: existingGroup.imageUrls,
          imageCount: existingGroup.imageUrls.length
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("\u6D4B\u8BD5\u5A92\u4F53\u7EC4\u529F\u80FD\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (path === "/setWebhook") {
      const webhookUrl = `${url.origin}/webhook`;
      try {
        console.log(`\u6B63\u5728\u8BBE\u7F6E Webhook \u5230 ${webhookUrl}`);
        const response = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${webhookUrl}`
        );
        const result = await response.json();
        console.log("\u8BBE\u7F6E Webhook \u7ED3\u679C:", JSON.stringify(result));
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("\u8BBE\u7F6E Webhook \u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (path === "/debug") {
      return new Response(JSON.stringify({
        env: {
          hasTelegramToken: !!telegramBotToken,
          hasNotionToken: !!notionToken,
          hasNotionDatabaseId: !!notionDatabaseId,
          notionTokenPrefix: notionToken ? notionToken.substring(0, 10) : null,
          notionDatabaseId,
          telegramTokenPrefix: telegramBotToken ? telegramBotToken.substring(0, 10) : null
        },
        request: {
          method: request.method,
          url: request.url,
          path
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (path === "/test-video-file") {
      try {
        const testVideoUrl = "https://example.com/test-video.mp4";
        const testFileUrl = "https://example.com/test-file.pdf";
        const testMessage = "\u89C6\u9891\u548C\u6587\u4EF6\u6D4B\u8BD5\u6D88\u606F - " + (/* @__PURE__ */ new Date()).toISOString();
        const pageId = await addMessageToNotion(
          notionToken,
          notionDatabaseId,
          testMessage,
          "\u6D4B\u8BD5",
          Math.floor(Date.now() / 1e3),
          "\u89C6\u9891\u548C\u6587\u4EF6",
          "test_channel",
          [],
          // 没有图片
          [testVideoUrl],
          // 视频URL
          [testFileUrl]
          // 文件URL
        );
        let success = false;
        if (typeof pageId === "string") {
          success = true;
        }
        return new Response(JSON.stringify({
          success,
          message: success ? "\u6210\u529F\u6DFB\u52A0\u6D4B\u8BD5\u89C6\u9891\u548C\u6587\u4EF6\u5230 Notion" : "\u6DFB\u52A0\u89C6\u9891\u548C\u6587\u4EF6\u5931\u8D25",
          videoUrl: testVideoUrl,
          fileUrl: testFileUrl,
          pageId
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("\u6D4B\u8BD5\u89C6\u9891\u548C\u6587\u4EF6\u4E0A\u4F20\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试文件代理功能
    if (path === "/test-file-proxy") {
      try {
        // 创建一个测试图片消息来获取file_id
        const testMessage = "文件代理测试 - " + new Date().toISOString();
        console.log("开始文件代理功能测试...");

        return new Response(JSON.stringify({
          success: true,
          message: "文件代理功能已就绪",
          instructions: [
            "1. 发送一张图片到你的Telegram频道",
            "2. 查看Notion中生成的永久链接",
            "3. 永久链接格式: " + url.origin + "/file/{file_id}",
            "4. 这些链接永不过期！"
          ],
          proxyEndpoint: url.origin + "/file/{file_id}"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("测试文件代理功能错误:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试新的 URL 格式
    if (path === "/test-new-url-format") {
      try {
        const testFileId = "AgACAgQAAyEFAASdRaXmAAO_aFFQjbIYM5hPa2_PoNJBNl98KBoAAjXLMRv33QFShNli0NZoDWwBAAMCAAN5AAM2BA";

        // 生成新格式的 URL
        const newFormatUrl = getFileUrlSync(url.origin, testFileId);

        // 测试路由匹配
        const testPaths = [
          `/file/${testFileId}`,
          `/file/${testFileId}/image.jpg`,
          `/file/${testFileId}/photo.png`,
          `/file/${testFileId}/document.pdf`
        ];

        const routeTests = testPaths.map(testPath => {
          const match = testPath.match(/^\/file\/([^\/]+)(?:\/(.+))?$/);
          return {
            path: testPath,
            matches: !!match,
            fileId: match ? match[1] : null,
            filename: match ? match[2] : null
          };
        });

        return new Response(JSON.stringify({
          success: true,
          message: "新 URL 格式测试",
          newUrlFormat: newFormatUrl,
          routeTests: routeTests,
          explanation: {
            oldFormat: `${url.origin}/file/${testFileId}`,
            newFormat: newFormatUrl,
            benefit: "新格式在 URL 中包含文件名，浏览器会使用 'image.jpg' 而不是长串字符作为文件名"
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试智能文件URL功能
    if (path === "/test-smart-file-url") {
      try {
        const testFileId = "AgACAgQAAyEFAASdRaXmAAO_aFFQjbIYM5hPa2_PoNJBNl98KBoAAjXLMRv33QFShNli0NZoDWwBAAMCAAN5AAM2BA";

        // 测试不同文件类型的URL生成
        const imageUrl = await getSmartFileUrl(url.origin, testFileId, telegramBotToken, 'image');
        const videoUrl = await getSmartFileUrl(url.origin, testFileId, telegramBotToken, 'video');
        const documentUrl = await getSmartFileUrl(url.origin, testFileId, telegramBotToken, 'document');

        // 对比旧的同步方法
        const oldUrl = getFileUrlSync(url.origin, testFileId);

        return new Response(JSON.stringify({
          success: true,
          message: "智能文件URL测试",
          testFileId: testFileId,
          urls: {
            oldMethod: oldUrl,
            smartImage: imageUrl,
            smartVideo: videoUrl,
            smartDocument: documentUrl
          },
          explanation: {
            smartMethod: "根据文件类型和Telegram API返回的真实文件路径生成正确的URL",
            benefits: [
              "图片文件：使用真实的.jpg/.png等扩展名",
              "视频文件：使用.mp4/.mov等正确扩展名",
              "文档文件：使用.pdf/.doc等正确扩展名",
              "浏览器和Notion能正确识别文件类型"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试不同文件类型的智能URL生成
    if (path === "/test-file-types") {
      try {
        // 模拟不同类型的文件测试
        const testCases = [
          {
            name: "图片文件",
            fileType: "image",
            expectedPattern: /\.(jpg|jpeg|png|gif|webp)$/i
          },
          {
            name: "视频文件",
            fileType: "video",
            expectedPattern: /\.(mp4|mov|avi|mkv|webm)$/i
          },
          {
            name: "文档文件",
            fileType: "document",
            expectedPattern: /\.(pdf|doc|docx|txt|zip|rar)$/i
          },
          {
            name: "音频文件",
            fileType: "audio",
            expectedPattern: /\.(mp3|wav|flac|aac)$/i
          }
        ];

        const testFileId = "AgACAgQAAyEFAASdRaXmAAO_aFFQjbIYM5hPa2_PoNJBNl98KBoAAjXLMRv33QFShNli0NZoDWwBAAMCAAN5AAM2BA";

        const results = [];
        for (const testCase of testCases) {
          try {
            const smartUrl = await getSmartFileUrl(url.origin, testFileId, telegramBotToken, testCase.fileType);
            const fileName = smartUrl.split('/').pop();
            const matchesPattern = testCase.expectedPattern.test(fileName);

            results.push({
              fileType: testCase.name,
              url: smartUrl,
              fileName: fileName,
              expectedPattern: testCase.expectedPattern.toString(),
              matchesPattern: matchesPattern,
              status: matchesPattern ? "✅ 正确" : "❌ 错误"
            });
          } catch (error) {
            results.push({
              fileType: testCase.name,
              error: error.message,
              status: "❌ 错误"
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: "文件类型智能URL测试",
          testFileId: testFileId,
          results: results,
          summary: {
            total: results.length,
            passed: results.filter(r => r.status === "✅ 正确").length,
            failed: results.filter(r => r.status === "❌ 错误").length
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 调试特定文件ID
    if (path === "/debug-video-file") {
      try {
        const videoFileId = "BAACAgEAAyEFAASdRaXmAAPTaFFeeRYiNhJFvObr33y_v5udYT8AAjcGAAJ2gmlG60luNx6Exgs2BA";
        console.log(`调试视频文件ID: ${videoFileId}`);

        // 1. 测试 getFileInfo
        let filePath = null;
        let fileInfoError = null;
        try {
          filePath = await getFileInfo(telegramBotToken, videoFileId);
          console.log(`获取到的文件路径: ${filePath}`);
        } catch (error) {
          fileInfoError = error.message;
          console.error(`getFileInfo 错误:`, error);
        }

        // 2. 如果获取到文件路径，测试 Telegram 文件 URL
        let telegramFileUrl = null;
        let telegramResponse = null;
        let telegramError = null;

        if (filePath) {
          try {
            telegramFileUrl = getTelegramFileUrl(telegramBotToken, filePath);
            console.log(`Telegram 文件 URL: ${telegramFileUrl}`);

            telegramResponse = await fetch(telegramFileUrl, { method: 'HEAD' });
            console.log(`Telegram 响应状态: ${telegramResponse.status}`);
          } catch (error) {
            telegramError = error.message;
            console.error(`fetch Telegram 文件错误:`, error);
          }
        }

        // 3. 测试智能URL生成
        let smartUrl = null;
        let smartUrlError = null;
        try {
          smartUrl = await getSmartFileUrl(url.origin, videoFileId, telegramBotToken, 'video');
        } catch (error) {
          smartUrlError = error.message;
        }

        return new Response(JSON.stringify({
          success: true,
          debug: {
            videoFileId: videoFileId,
            fileInfo: {
              filePath: filePath,
              error: fileInfoError
            },
            telegramFile: {
              url: telegramFileUrl,
              status: telegramResponse?.status,
              headers: telegramResponse ? Object.fromEntries(telegramResponse.headers.entries()) : null,
              error: telegramError
            },
            smartUrl: {
              url: smartUrl,
              error: smartUrlError
            },
            analysis: {
              fileIdValid: !fileInfoError,
              telegramFileAccessible: telegramResponse?.ok,
              possibleIssues: [
                fileInfoError ? "文件ID无效或已过期" : null,
                telegramError ? "Telegram文件服务器问题" : null,
                !telegramResponse?.ok ? "文件在Telegram服务器上不可访问" : null
              ].filter(Boolean)
            }
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("调试视频文件错误:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 简单测试文件访问
    if (path === "/test-file-access") {
      try {
        const testFileId = "BAACAgEAAyEFAASdRaXmAAPTaFFeeRYiNhJFvObr33y_v5udYT8AAjcGAAJ2gmlG60luNx6Exgs2BA";

        // 直接调用 Telegram API
        const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${testFileId}`;
        console.log(`测试API调用: ${apiUrl}`);

        const response = await fetch(apiUrl);
        const result = await response.json();

        return new Response(JSON.stringify({
          success: response.ok,
          status: response.status,
          apiUrl: apiUrl.replace(telegramBotToken, "***TOKEN***"),
          result: result,
          analysis: {
            fileIdValid: result.ok,
            errorCode: result.error_code,
            errorDescription: result.description,
            filePath: result.result?.file_path,
            fileSize: result.result?.file_size
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试视频文件响应头优化
    if (path === "/test-video-headers") {
      try {
        // 模拟视频文件的响应头设置
        const mockVideoPath = "videos/file_142.mp4";
        const mockContentType = "application/octet-stream"; // Telegram 通常返回这个

        // 应用我们的优化逻辑
        const headers = new Headers();

        // 智能 Content-Type 设置
        let finalContentType = mockContentType;
        if (!mockContentType || mockContentType === 'application/octet-stream') {
          if (mockVideoPath.toLowerCase().includes('.mp4')) {
            finalContentType = 'video/mp4';
          }
        }
        headers.set('Content-Type', finalContentType);

        // 文件名提取
        const pathParts = mockVideoPath.split('/');
        const fullFileName = pathParts[pathParts.length - 1];

        // 视频文件的 Content-Disposition 设置
        if (finalContentType.startsWith('video/')) {
          headers.set('Content-Disposition', `inline; filename="${fullFileName}"`);
          headers.set('Accept-Ranges', 'bytes');
        }

        // 其他头部
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(JSON.stringify({
          success: true,
          message: "视频文件响应头优化测试",
          mockData: {
            filePath: mockVideoPath,
            originalContentType: mockContentType
          },
          optimizedHeaders: Object.fromEntries(headers.entries()),
          notionCompatibility: {
            contentType: "✅ 正确的视频 MIME 类型",
            contentDisposition: "✅ inline 设置，包含正确文件名",
            acceptRanges: "✅ 支持字节范围请求，有助于视频流式传输",
            cors: "✅ CORS 头设置正确",
            expectedBehavior: "Notion 应该能够嵌入显示视频而不是下载"
          },
          troubleshooting: {
            ifStillDownloading: [
              "检查视频文件大小（Notion 可能对大文件有限制）",
              "确认视频格式（MP4 兼容性最好）",
              "检查 Notion 页面的文件属性设置"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试视频块功能
    if (path === "/test-video-blocks") {
      try {
        const testVideoUrls = [
          "https://telegram-bot-notion.liuyiran.workers.dev/file/BAACAgEAAyEFAASdRaXmAAPTaFFeeRYiNhJFvObr33y_v5udYT8AAjcGAAJ2gmlG60luNx6Exgs2BA/video.mp4"
        ];

        const testMessage = "视频块测试消息 - " + new Date().toISOString();
        console.log(`开始视频块测试，使用视频: ${JSON.stringify(testVideoUrls)}`);

        const pageId = await addMessageToNotion(
          notionToken,
          notionDatabaseId,
          testMessage,
          "测试",
          Math.floor(Date.now() / 1000),
          "视频测试",
          "test_channel",
          [], // 没有图片
          testVideoUrls, // 视频URL
          [] // 没有文件
        );

        let success = false;
        if (typeof pageId === "string") {
          console.log(`页面创建成功，ID: ${pageId}`);
          success = true;
        } else {
          console.error(`创建页面失败`);
        }

        return new Response(JSON.stringify({
          success,
          message: success ? "成功添加测试视频块到 Notion" : "添加视频块失败",
          videoUrls: testVideoUrls,
          pageId,
          explanation: {
            expected: "视频应该作为内容块嵌入到 Notion 页面中，而不仅仅是属性",
            videoBlockType: "使用 Notion 的 video block 类型",
            difference: "与图片一样，视频现在会显示在页面内容中"
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("测试视频块错误:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 调试大视频文件
    if (path === "/debug-large-video") {
      try {
        const largeVideoFileId = "BAACAgEAAyEFAASdRaXmAAP2aFFk_ksWXWqf93pwLfHQqNW31iAAAvkEAAL9HFlG4sD7_wQjhM82BA";
        console.log(`调试大视频文件ID: ${largeVideoFileId}`);

        // 1. 测试 getFileInfo
        let filePath = null;
        let fileSize = null;
        let fileInfoError = null;

        try {
          const fileInfoResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${largeVideoFileId}`);
          const fileInfoResult = await fileInfoResponse.json();

          if (fileInfoResult.ok) {
            filePath = fileInfoResult.result.file_path;
            fileSize = fileInfoResult.result.file_size;
            console.log(`文件路径: ${filePath}, 文件大小: ${fileSize} bytes`);
          } else {
            fileInfoError = fileInfoResult.description;
          }
        } catch (error) {
          fileInfoError = error.message;
        }

        // 2. 如果获取到文件信息，测试文件访问
        let telegramFileUrl = null;
        let headResponse = null;
        let headError = null;

        if (filePath) {
          try {
            telegramFileUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;
            console.log(`Telegram 文件 URL: ${telegramFileUrl}`);

            // 只做 HEAD 请求测试，不下载整个文件
            headResponse = await fetch(telegramFileUrl, {
              method: 'HEAD',
              // 设置较短的超时时间
              signal: AbortSignal.timeout(10000) // 10秒超时
            });
            console.log(`HEAD 响应状态: ${headResponse.status}`);
          } catch (error) {
            headError = error.message;
            console.error(`HEAD 请求错误:`, error);
          }
        }

        // 3. 分析文件大小限制
        const fileSizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : null;
        const isLargeFile = fileSize && fileSize > 20 * 1024 * 1024; // 20MB

        return new Response(JSON.stringify({
          success: true,
          debug: {
            fileId: largeVideoFileId,
            fileInfo: {
              filePath: filePath,
              fileSize: fileSize,
              fileSizeMB: fileSizeMB,
              error: fileInfoError
            },
            telegramAccess: {
              url: telegramFileUrl ? telegramFileUrl.replace(telegramBotToken, "***TOKEN***") : null,
              headStatus: headResponse?.status,
              headHeaders: headResponse ? Object.fromEntries(headResponse.headers.entries()) : null,
              error: headError
            },
            analysis: {
              fileAccessible: headResponse?.ok,
              isLargeFile: isLargeFile,
              possibleIssues: [
                !filePath ? "文件ID无效或已过期" : null,
                headError ? "Telegram文件服务器访问问题" : null,
                isLargeFile ? "文件过大，可能超出Cloudflare Workers限制" : null,
                fileSize && fileSize > 50 * 1024 * 1024 ? "文件超过50MB，Telegram Bot API限制" : null
              ].filter(Boolean),
              recommendations: [
                isLargeFile ? "考虑使用流式传输或分块下载" : null,
                "添加Range请求支持",
                "优化超时处理",
                "考虑使用Telegram的直接链接"
              ].filter(Boolean)
            }
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("调试大视频文件错误:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试大文件处理改进
    if (path === "/test-large-file-handling") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "大文件处理优化说明",
          improvements: {
            rangeRequests: {
              description: "支持HTTP Range请求，用于视频流式传输",
              benefit: "允许浏览器和播放器分块加载大文件"
            },
            timeoutOptimization: {
              description: "增加超时时间到120秒",
              benefit: "给大文件更多时间完成传输"
            },
            errorHandling: {
              description: "智能识别文件过大错误",
              benefit: "为超过20MB的文件提供清晰的错误信息"
            },
            caching: {
              description: "缓存文件路径信息",
              benefit: "减少重复的API调用，提高响应速度"
            }
          },
          limitations: {
            telegramBotApi: "Telegram Bot API限制文件大小为20MB",
            cloudflareWorkers: "Cloudflare Workers有CPU时间和内存限制",
            recommendation: "对于大文件，建议使用较小的文件或Telegram的直接分享链接"
          },
          testInstructions: [
            "发送小文件（<20MB）：应该正常工作",
            "发送大文件（>20MB）：会收到友好的错误提示",
            "视频文件：支持流式传输和Range请求"
          ]
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试优化后的错误处理
    if (path === "/test-optimized-error-handling") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "错误处理优化说明",
          optimization: {
            before: {
              description: "所有错误都重试3次",
              largeFileHandling: "重试3次后才返回错误（约7秒）",
              apiCalls: "4次API调用",
              userExperience: "用户需要等待很久才看到错误"
            },
            after: {
              description: "智能区分永久性错误和临时性错误",
              largeFileHandling: "立即返回错误（<1秒）",
              apiCalls: "1次API调用",
              userExperience: "立即获得反馈"
            }
          },
          immediateFailureErrors: [
            "file is too big - 文件超过20MB",
            "invalid file_id - 文件ID无效",
            "file not found - 文件不存在",
            "bad request - 请求格式错误"
          ],
          retryableErrors: [
            "网络超时",
            "服务器临时不可用",
            "API限流"
          ],
          benefits: [
            "✅ 大文件错误立即反馈（从7秒降到<1秒）",
            "✅ 减少不必要的API调用（从4次降到1次）",
            "✅ 保持对临时错误的重试机制",
            "✅ 更好的用户体验"
          ]
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 调试错误信息格式
    if (path === "/debug-error-format") {
      try {
        const invalidFileId = "INVALID_FILE_ID";
        console.log(`测试无效文件ID: ${invalidFileId}`);

        try {
          await getFileInfo(telegramBotToken, invalidFileId);
        } catch (error) {
          return new Response(JSON.stringify({
            success: true,
            message: "错误信息格式调试",
            errorDetails: {
              originalMessage: error.message,
              messageType: typeof error.message,
              messageLength: error.message.length,
              containsFileTooBig: error.message.includes('file is too big'),
              containsFileTooBigLower: error.message.toLowerCase().includes('file is too big'),
              containsInvalidFileId: error.message.includes('invalid file_id'),
              containsInvalidFileIdLower: error.message.toLowerCase().includes('invalid file_id'),
              containsBadRequest: error.message.toLowerCase().includes('bad request'),
              errorStack: error.stack
            },
            testChecks: {
              immediateFailureErrors: [
                'file is too big',
                'invalid file_id',
                'file not found',
                'bad request'
              ],
              matchResults: [
                'file is too big',
                'invalid file_id',
                'file not found',
                'bad request'
              ].map(errorType => ({
                errorType,
                matches: error.message.toLowerCase().includes(errorType.toLowerCase())
              }))
            }
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({
          success: false,
          message: "没有捕获到预期的错误"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试创建日期功能
    if (path === "/test-creation-date") {
      try {
        const testMessage = "创建日期测试消息 - " + new Date().toISOString();
        console.log(`开始创建日期测试，消息: ${testMessage}`);

        const pageId = await addMessageToNotion(
          notionToken,
          notionDatabaseId,
          testMessage,
          "测试",
          Math.floor(Date.now() / 1000),
          "测试",
          "test_channel",
          [], // 没有图片
          [], // 没有视频
          []  // 没有文件
        );

        let success = false;
        if (typeof pageId === "string") {
          console.log(`页面创建成功，ID: ${pageId}`);
          success = true;
        } else {
          console.error(`创建页面失败`);
        }

        return new Response(JSON.stringify({
          success,
          message: success ? "成功添加带创建日期的测试消息到 Notion" : "添加消息失败",
          pageId,
          testMessage,
          creationDate: new Date().toISOString().slice(0, 16),
          explanation: {
            feature: "自动添加创建日期属性",
            format: "YYYY-MM-DDTHH:MM",
            timezone: "使用服务器时区（UTC）",
            property: "创建日期字段会自动设置为当前日期和时间（精确到分钟）",
            example: "2025-06-17T14:35"
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("测试创建日期功能错误:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试转发图片修复
    if (path === "/test-forwarded-image-fix") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "转发图片处理修复说明",
          problem: {
            description: "转发的图片被错误识别为PDF文件",
            cause: [
              "转发的图片在Telegram中变成document类型而不是photo类型",
              "代码将所有document都当作文档处理",
              "getSmartFileUrl强制将非标准文档扩展名改为.pdf"
            ]
          },
          solution: {
            step1: {
              description: "检查document的mime_type",
              implementation: "if (mimeType && mimeType.startsWith('image/'))",
              result: "图片文档被正确识别为图片"
            },
            step2: {
              description: "根据mime_type分类处理",
              implementation: "图片文档添加到imageUrls，真正文档添加到fileUrls",
              result: "图片出现在'图片'属性，文档出现在'文件'属性"
            },
            step3: {
              description: "保留图片文件的原始扩展名",
              implementation: "在getSmartFileUrl中不强制改变图片扩展名",
              result: ".jpg文件保持.jpg扩展名，不会变成.pdf"
            }
          },
          testScenarios: [
            {
              scenario: "转发图片文件（如：image.jpg）",
              before: "被识别为PDF，添加到'文件'属性，扩展名变为.pdf",
              after: "被识别为图片，添加到'图片'属性，保持.jpg扩展名"
            },
            {
              scenario: "真正的PDF文件",
              before: "正确处理",
              after: "仍然正确处理，无影响"
            }
          ],
          verification: {
            steps: [
              "1. 从其他频道转发一张图片到bot频道",
              "2. 检查Notion中的记录",
              "3. 图片应该出现在'图片'属性中",
              "4. 文件名应该保持原始扩展名（如.jpg）",
              "5. 图片应该能在Notion中正常显示"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试转发消息内容修复
    if (path === "/test-forwarded-content-fix") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "转发消息内容提取修复说明",
          problem: {
            description: "转发消息中的文本内容被文件名覆盖",
            example: "转发消息包含'这是一张美丽的图片'和图片文件，但Notion中只显示'图片: filename.jpg'",
            cause: "代码直接使用文件名作为messageContent，忽略了channelPost.caption和channelPost.text"
          },
          solution: {
            priority: "优先级顺序：channelPost.caption > channelPost.text > 文件名",
            implementation: {
              before: "messageContent = `图片: ${fileName}`;",
              after: "messageContent = channelPost.caption || channelPost.text || `图片: ${fileName}`;"
            },
            benefits: [
              "保留转发消息的原始文本内容",
              "图片和文档都能正确显示消息内容",
              "只有在没有文本时才显示文件名"
            ]
          },
          testScenarios: [
            {
              scenario: "转发带文字的图片",
              before: "Notion显示：图片: filename.jpg",
              after: "Notion显示：原始消息文字内容"
            },
            {
              scenario: "转发带文字的文档",
              before: "Notion显示：filename.pdf",
              after: "Notion显示：原始消息文字内容"
            },
            {
              scenario: "转发纯图片（无文字）",
              before: "Notion显示：图片: filename.jpg",
              after: "Notion显示：图片: filename.jpg（保持不变）"
            }
          ],
          verification: {
            steps: [
              "1. 转发一条包含文字和图片的消息到bot频道",
              "2. 检查Notion中的'内容'属性",
              "3. 应该显示原始消息的文字内容，而不是文件名",
              "4. 图片仍然正确出现在'图片'属性中"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 测试媒体组内容修复
    if (path === "/test-media-group-content-fix") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "媒体组消息内容提取修复说明",
          problem: {
            description: "转发的多媒体消息（包含文本和多个视频）显示'媒体组消息'而不是原始文本",
            example: "转发消息包含'这是一组精彩的视频'和多个视频文件，但Notion中只显示'媒体组消息'",
            cause: "媒体组处理逻辑只检查channelPost.caption，忽略了channelPost.text"
          },
          solution: {
            priority: "优先级顺序：channelPost.caption > channelPost.text > '媒体组消息'",
            implementation: {
              before: "const content = channelPost.caption || '媒体组消息';",
              after: "const content = channelPost.caption || channelPost.text || '媒体组消息';"
            },
            benefits: [
              "保留转发媒体组消息的原始文本内容",
              "多视频、多图片消息都能正确显示消息内容",
              "只有在没有文本时才显示默认的'媒体组消息'"
            ]
          },
          testScenarios: [
            {
              scenario: "转发带文字的多视频消息",
              before: "Notion显示：媒体组消息",
              after: "Notion显示：原始消息文字内容"
            },
            {
              scenario: "转发带文字的多图片消息",
              before: "Notion显示：媒体组消息",
              after: "Notion显示：原始消息文字内容"
            },
            {
              scenario: "转发纯媒体（无文字）",
              before: "Notion显示：媒体组消息",
              after: "Notion显示：媒体组消息（保持不变）"
            }
          ],
          relatedFixes: [
            "单个转发图片内容修复（已完成）",
            "单个转发文档内容修复（已完成）",
            "媒体组内容修复（当前修复）"
          ],
          verification: {
            steps: [
              "1. 转发一条包含文字和多个视频的消息到bot频道",
              "2. 检查Notion中的'内容'属性",
              "3. 应该显示原始消息的文字内容，而不是'媒体组消息'",
              "4. 视频仍然正确出现在'视频'属性中"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 调试媒体组消息结构
    if (path === "/debug-media-group-message") {
      try {
        return new Response(JSON.stringify({
          success: true,
          message: "媒体组消息调试说明",
          instructions: [
            "这个端点用于调试媒体组消息的结构",
            "当你转发多视频带文本的消息时，请查看Cloudflare Workers的日志",
            "日志中会显示：",
            "1. channelPost.caption 的值",
            "2. channelPost.text 的值",
            "3. 最终使用的 content 值",
            "4. 媒体组消息内容: [实际内容]"
          ],
          debugSteps: [
            "1. 转发一条包含文字和多个视频的消息到bot频道",
            "2. 在Cloudflare Workers Dashboard中查看实时日志",
            "3. 查找包含'媒体组消息内容:'的日志行",
            "4. 检查channelPost对象的完整结构"
          ],
          logLocation: "Cloudflare Workers Dashboard > telegram-bot-notion > Logs",
          expectedLogs: [
            "检测到媒体组消息，组ID: [group_id]",
            "为媒体组创建新的Notion页面",
            "媒体组消息内容: [应该显示原始文本而不是'媒体组消息']"
          ],
          troubleshooting: {
            ifStillShowsDefault: [
              "检查channelPost.caption是否为null/undefined",
              "检查channelPost.text是否为null/undefined",
              "可能文本内容在其他字段中（如forwarded_from等）"
            ],
            possibleCauses: [
              "转发消息的文本可能在不同的字段中",
              "媒体组的第一条消息可能没有文本",
              "Telegram API结构可能与预期不同"
            ]
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    // 文件代理路由 - 处理 /file/{file_id} 或 /file/{file_id}/{filename} 请求
    const fileMatch = path.match(/^\/file\/([^\/]+)(?:\/(.+))?$/);
    if (fileMatch) {
      // 处理 CORS 预检请求
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      if (request.method === "GET") {
      const fileId = fileMatch[1];
      const filename = fileMatch[2] || 'file'; // 提取文件名（如果有的话）
      console.log(`收到文件代理请求，文件ID: ${fileId}, 文件名: ${filename}`);

      try {
        // 从KV缓存中尝试获取文件路径
        let filePath = null;
        if (env.FILE_CACHE) {
          const cacheKey = `file_path_${fileId}`;
          filePath = await env.FILE_CACHE.get(cacheKey);
          if (filePath) {
            console.log(`从缓存获取文件路径: ${filePath}`);
          }
        }

        // 如果缓存中没有，则从Telegram API获取（带重试机制）
        if (!filePath) {
          console.log(`缓存未命中，从Telegram API获取文件路径`);

          // 重试机制：最多重试3次
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              filePath = await getFileInfo(telegramBotToken, fileId);
              break; // 成功获取，跳出重试循环
            } catch (apiError) {
              console.error(`获取文件信息失败:`, apiError.message);

              // 检查是否是不需要重试的永久性错误
              const immediateFailureErrors = [
                'file is too big',
                'invalid file_id',
                'file not found',
                'bad request'
              ];

              const isImmediateFailure = immediateFailureErrors.some(error =>
                apiError.message.toLowerCase().includes(error.toLowerCase())
              );

              if (isImmediateFailure) {
                console.error(`检测到永久性错误，不进行重试: ${apiError.message}`);

                // 针对文件过大的特殊处理
                if (apiError.message.toLowerCase().includes('file is too big')) {
                  console.error(`文件过大，超出Telegram Bot API限制（20MB）`);
                  return new Response(JSON.stringify({
                    error: "文件过大",
                    message: "此文件超过20MB，无法通过Bot API访问",
                    suggestion: "请尝试发送较小的文件，或使用Telegram的直接分享链接",
                    fileId: fileId,
                    limitation: "Telegram Bot API限制文件大小为20MB"
                  }), {
                    status: 413, // Payload Too Large
                    headers: { "Content-Type": "application/json" }
                  });
                }

                // 其他永久性错误
                return new Response(JSON.stringify({
                  error: "文件访问失败",
                  message: apiError.message,
                  fileId: fileId,
                  suggestion: "请检查文件是否存在或文件ID是否有效"
                }), {
                  status: 404,
                  headers: { "Content-Type": "application/json" }
                });
              }

              // 只对临时性错误进行重试
              retryCount++;
              console.error(`临时性错误，进行重试 (尝试 ${retryCount}/${maxRetries}):`, apiError.message);

              if (retryCount >= maxRetries) {
                throw new Error(`获取文件信息失败，已重试${maxRetries}次: ${apiError.message}`);
              }

              // 等待一段时间后重试（指数退避）
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          }

          // 将文件路径缓存1小时
          if (env.FILE_CACHE && filePath) {
            const cacheKey = `file_path_${fileId}`;
            await env.FILE_CACHE.put(cacheKey, filePath, { expirationTtl: 3600 });
            console.log(`已缓存文件路径: ${filePath}`);
          }
        }

        // 构建Telegram文件URL并代理请求
        const telegramFileUrl = getTelegramFileUrl(telegramBotToken, filePath);
        console.log(`代理请求Telegram文件: ${telegramFileUrl}`);

        // 处理 Range 请求（用于大文件流式传输）
        const requestHeaders = new Headers();
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
          requestHeaders.set('Range', rangeHeader);
          console.log(`转发 Range 请求: ${rangeHeader}`);
        }

        // 从Telegram获取文件，支持Range请求和超时控制
        const response = await fetch(telegramFileUrl, {
          headers: requestHeaders,
          // 设置较长的超时时间用于大文件
          signal: AbortSignal.timeout(120000) // 120秒超时
        });
        if (!response.ok) {
          console.error(`获取Telegram文件失败: ${response.status} ${response.statusText}`);
          return new Response('文件不可访问', { status: 404 });
        }

        // 设置响应头
        const headers = new Headers();

        // 复制原始响应头（排除一些不需要的头）
        for (const [key, value] of response.headers.entries()) {
          if (!['connection', 'content-encoding', 'transfer-encoding', 'content-disposition'].includes(key.toLowerCase())) {
            headers.set(key, value);
          }
        }

        // 确保 Range 请求的响应头正确传递
        if (response.headers.get('content-range')) {
          headers.set('Content-Range', response.headers.get('content-range'));
        }
        if (response.headers.get('accept-ranges')) {
          headers.set('Accept-Ranges', response.headers.get('accept-ranges'));
        }

        // 智能设置 Content-Type，特别优化视频文件
        const contentType = response.headers.get('content-type');
        if (!contentType || contentType === 'application/octet-stream') {
          // 根据文件路径推断正确的 Content-Type
          if (filePath.toLowerCase().includes('.mp4')) {
            headers.set('Content-Type', 'video/mp4');
          } else if (filePath.toLowerCase().includes('.mov')) {
            headers.set('Content-Type', 'video/quicktime');
          } else if (filePath.toLowerCase().includes('.avi')) {
            headers.set('Content-Type', 'video/x-msvideo');
          } else if (filePath.toLowerCase().includes('.webm')) {
            headers.set('Content-Type', 'video/webm');
          } else if (filePath.toLowerCase().includes('.mkv')) {
            headers.set('Content-Type', 'video/x-matroska');
          } else if (filePath.toLowerCase().includes('.jpg') || filePath.toLowerCase().includes('.jpeg')) {
            headers.set('Content-Type', 'image/jpeg');
          } else if (filePath.toLowerCase().includes('.png')) {
            headers.set('Content-Type', 'image/png');
          } else if (filePath.toLowerCase().includes('.gif')) {
            headers.set('Content-Type', 'image/gif');
          } else if (filePath.toLowerCase().includes('.webp')) {
            headers.set('Content-Type', 'image/webp');
          } else {
            headers.set('Content-Type', 'application/octet-stream');
          }
        } else {
          headers.set('Content-Type', contentType);
        }

        // 从文件路径提取正确的文件名
        const finalContentType = headers.get('Content-Type');
        let fileName = 'file';
        let fileExtension = '';

        if (filePath) {
          // 从文件路径中提取文件名和扩展名 (例如: "videos/file_137.mp4" -> "file_137.mp4")
          const pathParts = filePath.split('/');
          const fullFileName = pathParts[pathParts.length - 1];
          const nameParts = fullFileName.split('.');

          if (nameParts.length > 1) {
            fileExtension = '.' + nameParts[nameParts.length - 1];
            fileName = nameParts.slice(0, -1).join('.');
          } else {
            fileName = fullFileName;
          }
        }

        // 如果没有扩展名，根据 Content-Type 推断
        if (!fileExtension && finalContentType) {
          if (finalContentType.startsWith('video/mp4')) {
            fileExtension = '.mp4';
          } else if (finalContentType.startsWith('video/quicktime')) {
            fileExtension = '.mov';
          } else if (finalContentType.startsWith('video/webm')) {
            fileExtension = '.webm';
          } else if (finalContentType.startsWith('image/jpeg')) {
            fileExtension = '.jpg';
          } else if (finalContentType.startsWith('image/png')) {
            fileExtension = '.png';
          } else if (finalContentType.startsWith('image/gif')) {
            fileExtension = '.gif';
          } else if (finalContentType.startsWith('image/webp')) {
            fileExtension = '.webp';
          }
        }

        const fullFileName = fileName + fileExtension;

        // 针对 Notion 优化的 Content-Disposition 设置
        if (finalContentType && finalContentType.startsWith('video/')) {
          // 对于视频文件，设置为 inline 以便 Notion 嵌入显示
          headers.set('Content-Disposition', `inline; filename="${fullFileName}"`);

          // 添加视频相关的头部，帮助 Notion 识别和流式传输
          headers.set('Accept-Ranges', 'bytes');

        } else if (finalContentType && finalContentType.startsWith('image/')) {
          // 对于图片文件，不设置 Content-Disposition，让浏览器默认内联显示
          // 这样 Notion 更容易识别为图片
          headers.delete('Content-Disposition');

        } else {
          // 对于其他文件类型，设置为 attachment（下载）
          headers.set('Content-Disposition', `attachment; filename="${fullFileName}"`);
        }

        // 添加CORS和缓存控制
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存一年

        console.log(`成功代理文件，大小: ${response.headers.get('content-length') || '未知'}`);
        console.log(`最终响应头:`, {
          'Content-Type': headers.get('Content-Type'),
          'Content-Disposition': headers.get('Content-Disposition'),
          'Cache-Control': headers.get('Cache-Control'),
          'Access-Control-Allow-Origin': headers.get('Access-Control-Allow-Origin')
        });

        // 返回代理响应
        return new Response(response.body, {
          status: response.status,
          headers
        });

      } catch (error) {
        console.error(`文件代理错误:`, error);

        // 提供更详细的错误信息
        if (error.message.toLowerCase().includes('file is too big')) {
          return new Response(JSON.stringify({
            error: "文件过大",
            message: "此文件超过20MB，无法通过Bot API访问",
            suggestion: "请尝试发送较小的文件",
            limitation: "Telegram Bot API限制文件大小为20MB"
          }), {
            status: 413,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({
          error: "文件访问失败",
          message: error.message,
          suggestion: "请检查文件是否存在或稍后重试"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
export {
  fixed_default as default
};
//# sourceMappingURL=fixed.js.map
