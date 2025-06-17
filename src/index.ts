/**
 * Telegram Bot Notion 同步服务 - TypeScript版本
 * 
 * 强大的 Cloudflare Workers 服务，用于将 Telegram 频道消息自动同步到 Notion 数据库
 * 支持永久有效的文件链接和智能文件处理
 */

import {
  Environment,
  TelegramUpdate,
  TelegramChannelPost,
  MessageType,
  RequestHandler
} from './types';



import {
  getFileInfo,
  getFileUrlSync,
  getSmartFileUrl,
  getTelegramFileUrl
} from './utils/file';

import {
  getMediaGroupInfo,
  saveMediaGroupInfo,
  updateMediaGroupInfo
} from './utils/mediaGroup';

import {
  addMessageToNotion,
  updatePageMedia
} from './services/notion';

/**
 * 主要的Worker处理函数
 */
const worker: RequestHandler = async (request: Request, env: Environment, _ctx: ExecutionContext): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;
  console.log(`收到请求: ${request.method} ${path}`);

  // 获取环境变量
  const notionToken = env.NOTION_TOKEN || "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";
  const notionDatabaseId = env.NOTION_DATABASE_ID || "1fe3eb3c2d55802fa90ddb8a0b2d44bb";
  const telegramBotToken = env.TELEGRAM_BOT_TOKEN || "7515858617:AAGUVvGxW9fXpZqLKQoiZFvj5BgmQlkfcSE";

  console.log(`使用 Notion 令牌: ${notionToken.substring(0, 10)}...`);
  console.log(`使用数据库 ID: ${notionDatabaseId}`);
  console.log(`使用 Telegram Bot 令牌: ${telegramBotToken.substring(0, 10)}...`);

  // 根路由
  if (path === "/" || path === "") {
    return new Response("Telegram Bot to Notion 集成服务正在运行!", {
      headers: { "Content-Type": "text/plain;charset=UTF-8" }
    });
  }

  // Webhook 处理
  if (path === "/webhook" && request.method === "POST") {
    try {
      const update: TelegramUpdate = await request.json();
      console.log("收到 Telegram 更新:", JSON.stringify(update, null, 2));



      const channelPost: TelegramChannelPost | undefined = update.channel_post;
      if (!channelPost) {
        console.log("不是频道消息，忽略");
        return new Response("OK", { status: 200 });
      }

      console.log("处理频道消息:", JSON.stringify(channelPost, null, 2));

      const messageId = channelPost.message_id;
      const chatTitle = channelPost.chat.title || "未知频道";
      const channelUsername = channelPost.chat.username || "";

      console.log(`频道: ${chatTitle}, 消息ID: ${messageId}`);



      let messageContent = "";
      let messageType: MessageType = "文本";
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];
      const fileUrls: string[] = [];

      // 处理文本消息
      if (channelPost.text) {
        messageContent = channelPost.text;
        messageType = "文本";

        console.log(`文本消息: ${messageContent}`);
      }

      // 处理图片消息
      if (channelPost.photo && channelPost.photo.length > 0) {
        const photos = channelPost.photo;
        const photo = photos[photos.length - 1]; // 获取最大尺寸的图片

        if (photo) {
          console.log(`检测到图片，file_id: ${photo.file_id}`);

          try {
            const imageUrl = await getSmartFileUrl(url.origin, photo.file_id, telegramBotToken, 'image');
            imageUrls.push(imageUrl);
            console.log(`生成图片URL: ${imageUrl}`);
          } catch (error) {
            console.error(`生成图片URL失败:`, error);
            const fallbackUrl = getFileUrlSync(url.origin, photo.file_id);
            imageUrls.push(fallbackUrl);
            console.log(`使用后备图片URL: ${fallbackUrl}`);
          }
        }

        messageContent = channelPost.caption || "图片消息";
        messageType = "图片";

      }

      // 处理视频消息
      if (channelPost.video) {
        const video = channelPost.video;
        console.log(`检测到视频，file_id: ${video.file_id}, 大小: ${video.file_size || 'unknown'} bytes`);
        
        // 检查文件大小
        const maxFileSize = 20 * 1024 * 1024; // 20MB
        if (video.file_size && video.file_size > maxFileSize) {
          console.log(`视频文件过大 (${video.file_size} bytes)，跳过处理`);
          messageContent = channelPost.caption || `视频文件过大 (${Math.round(video.file_size / 1024 / 1024)}MB)，无法在Notion中播放`;
          messageType = "文件";
        } else {
          try {
            const videoUrl = await getSmartFileUrl(url.origin, video.file_id, telegramBotToken, 'video');
            videoUrls.push(videoUrl);
            console.log(`生成视频URL: ${videoUrl}`);
            messageContent = channelPost.caption || "视频消息";
            messageType = "视频";
          } catch (error) {
            console.error(`生成视频URL失败:`, error);
            const fallbackUrl = getFileUrlSync(url.origin, video.file_id);
            fileUrls.push(fallbackUrl);
            messageContent = channelPost.caption || "视频文件";
            messageType = "文件";
          }
        }
      }

      // 处理文档消息
      if (channelPost.document) {
        const document = channelPost.document;
        const fileName = document.file_name || `document_${document.file_id}`;
        const mimeType = document.mime_type;
        
        console.log(`检测到文档: ${fileName}, MIME类型: ${mimeType}, 大小: ${document.file_size || 'unknown'} bytes`);

        // 检查文件大小
        const maxFileSize = 20 * 1024 * 1024; // 20MB
        if (document.file_size && document.file_size > maxFileSize) {
          console.log(`文档文件过大 (${document.file_size} bytes)，跳过处理`);
          messageContent = channelPost.caption || channelPost.text || `文档文件过大 (${Math.round(document.file_size / 1024 / 1024)}MB)：${fileName}`;
          messageType = "文件";
        } else {
          try {
            // 检查是否是图片文档（转发的图片通常会变成document类型）
            if (mimeType && mimeType.startsWith('image/')) {
              console.log(`检测到图片文档: ${fileName}, MIME类型: ${mimeType}`);
              // 优先使用消息的文本内容，如果没有才使用文件名
              messageContent = channelPost.caption || channelPost.text || `图片: ${fileName}`;
              messageType = "图片";
              console.log(`图片文档消息内容: ${messageContent}`);
              
              const imageUrl = await getSmartFileUrl(url.origin, document.file_id, telegramBotToken, 'image');
              imageUrls.push(imageUrl);
              console.log(`生成图片文档URL: ${imageUrl}`);
            } else {
              // 真正的文档文件
              console.log(`检测到文档文件: ${fileName}, MIME类型: ${mimeType}`);
              // 优先使用消息的文本内容，如果没有才使用文件名
              messageContent = channelPost.caption || channelPost.text || fileName;
              messageType = "文件";
              console.log(`文档文件消息内容: ${messageContent}`);
              
              const fileUrl = await getSmartFileUrl(url.origin, document.file_id, telegramBotToken, 'document');
              fileUrls.push(fileUrl);
              console.log(`生成文档URL: ${fileUrl}`);
            }
          } catch (error) {
            console.error(`处理文档时出错:`, error);
            messageContent = channelPost.caption || channelPost.text || fileName;
            messageType = "文件";
            
            const fallbackUrl = getFileUrlSync(url.origin, document.file_id);
            fileUrls.push(fallbackUrl);
            console.log(`使用后备文档URL: ${fallbackUrl}`);
          }
        }
      }

      // 输出处理结果
      if (imageUrls.length > 0) {
        console.log(`消息包含 ${imageUrls.length} 张图片`);
      }
      if (videoUrls.length > 0) {
        console.log(`消息包含 ${videoUrls.length} 个视频`);
      }
      if (fileUrls.length > 0) {
        console.log(`消息包含 ${fileUrls.length} 个文件`);
      }

      // 处理媒体组
      if (channelPost.media_group_id) {
        const mediaGroupId = channelPost.media_group_id;
        console.log(`检测到媒体组消息，组ID: ${mediaGroupId}`);


        
        // 处理媒体组逻辑...
        const existingGroup = getMediaGroupInfo(mediaGroupId);
        if (existingGroup) {
          console.log(`更新现有媒体组: ${mediaGroupId}`);

          // 更新媒体组信息
          const updatedGroup = updateMediaGroupInfo(mediaGroupId, imageUrls, videoUrls, fileUrls);

          if (updatedGroup) {
            // 检查当前消息是否有文本内容，如果有且之前的内容是默认的"媒体组消息"，则更新页面内容
            const currentContent = channelPost.caption || channelPost.text ||
                                 channelPost.forward_signature || channelPost.forward_sender_name;

            if (currentContent && updatedGroup.messageContent === "媒体组消息") {
              console.log(`发现新的文本内容，更新页面标题: ${currentContent}`);
              try {
                // 更新页面标题
                const updatePageResponse = await fetch(`https://api.notion.com/v1/pages/${updatedGroup.pageId}`, {
                  method: "PATCH",
                  headers: {
                    "Authorization": `Bearer ${notionToken}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    properties: {
                      "内容": {
                        title: [
                          {
                            text: {
                              content: currentContent
                            }
                          }
                        ]
                      }
                    }
                  })
                });

                if (updatePageResponse.ok) {
                  console.log(`页面标题更新成功: ${currentContent}`);
                  // 更新缓存中的内容
                  updatedGroup.messageContent = currentContent;
                  saveMediaGroupInfo(mediaGroupId, updatedGroup);
                } else {
                  console.error(`页面标题更新失败: ${updatePageResponse.status}`);
                }
              } catch (titleUpdateError) {
                console.error(`更新页面标题时出错:`, titleUpdateError);
              }
            }

            // 更新Notion页面，添加新的媒体内容
            console.log(`向页面 ${updatedGroup.pageId} 添加新媒体内容`);
            try {
              const updateResult = await updatePageMedia(
                notionToken,
                updatedGroup.pageId,
                imageUrls,
                videoUrls,
                fileUrls
              );

              if (updateResult) {
                console.log(`媒体组 ${mediaGroupId} 更新成功！`);
              } else {
                console.error(`媒体组 ${mediaGroupId} 更新失败！`);
              }
            } catch (updateError) {
              console.error(`更新媒体组时出错:`, updateError);
            }
          }
        } else {
          console.log(`为媒体组创建新的Notion页面`);

          
          // 尝试从多个字段提取文本内容
          let content = channelPost.caption || channelPost.text;

          // 如果没有找到文本，检查转发消息的其他字段
          if (!content) {
            // 检查转发签名
            if (channelPost.forward_signature) {
              content = channelPost.forward_signature;
              console.log(`从转发签名获取内容: ${content}`);
            }
            // 检查转发发送者名称
            else if (channelPost.forward_sender_name) {
              content = channelPost.forward_sender_name;
              console.log(`从转发发送者获取内容: ${content}`);
            }
          }

          // 如果仍然没有内容，使用默认值
          if (!content) {
            content = "媒体组消息";
          }

          console.log(`媒体组消息内容: ${content}`);


          
          const pageId = await addMessageToNotion(
            notionToken,
            notionDatabaseId,
            content,
            `频道: ${chatTitle}`,
            messageId,
            "媒体组",
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
            console.log(`已创建媒体组记录，页面ID: ${pageId}`);
          } else {
            console.error(`创建媒体组Notion页面失败`);
          }
        }
      } else {
        console.log(`处理普通消息，添加到Notion`);

        try {
          const result = await addMessageToNotion(
            notionToken,
            notionDatabaseId,
            messageContent,
            `频道: ${chatTitle}`,
            messageId,
            messageType,
            channelUsername,
            imageUrls,
            videoUrls,
            fileUrls
          );
          console.log(`频道消息同步到 Notion ${result ? "成功" : "失败"}`);
        } catch (syncError) {
          console.error(`同步频道消息到Notion时出错:`, syncError);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("处理 Webhook 错误:", error);
      return new Response("处理 Webhook 错误", { status: 500 });
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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    const fileId = fileMatch[1];
    const requestedFileName = fileMatch[2] || 'file';

    if (!fileId) {
      return new Response(JSON.stringify({
        error: "无效的文件ID"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    console.log(`文件代理请求: fileId=${fileId}, fileName=${requestedFileName}`);

    try {
      // 从缓存中获取文件路径
      let filePath: string | null = null;

      try {
        const cachedPath = await env.FILE_CACHE.get(`file_path:${fileId}`);
        if (cachedPath) {
          filePath = cachedPath;
          console.log(`从缓存获取文件路径: ${filePath}`);
        }
      } catch (cacheError) {
        console.log("缓存读取失败，将从API获取:", (cacheError as Error).message);
      }

      // 如果缓存中没有，从Telegram API获取
      if (!filePath) {
        try {
          if (telegramBotToken) {
            filePath = await getFileInfo(telegramBotToken, fileId);
            console.log(`从API获取文件路径: ${filePath}`);
          }

          // 缓存文件路径1小时
          if (filePath) {
            try {
              await env.FILE_CACHE.put(`file_path:${fileId}`, filePath, { expirationTtl: 3600 });
              console.log("文件路径已缓存");
            } catch (cacheError) {
              console.log("缓存写入失败:", (cacheError as Error).message);
            }
          }
        } catch (apiError) {
          console.error("从API获取文件路径失败:", apiError);

          // 检查是否是大文件错误
          const errorMessage = (apiError as Error).message;
          if (errorMessage.includes("file is too big") || errorMessage.includes("Request Entity Too Large")) {
            return new Response(JSON.stringify({
              error: "文件过大",
              message: "文件大小超过20MB，无法通过Telegram Bot API访问",
              fileId: fileId,
              suggestion: "请尝试直接下载或使用其他方式访问此文件"
            }), {
              status: 413,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }

          return new Response(JSON.stringify({
            error: "文件访问失败",
            message: errorMessage,
            fileId: fileId
          }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
      }

      if (!filePath) {
        return new Response(JSON.stringify({
          error: "文件未找到",
          fileId: fileId
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // 构建Telegram文件URL
      const telegramFileUrl = getTelegramFileUrl(telegramBotToken, filePath);
      console.log(`代理请求到: ${telegramFileUrl}`);

      // 转发请求到Telegram
      const headers = new Headers();

      // 转发Range请求头（用于视频流式传输）
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        headers.set('Range', rangeHeader);
        console.log(`转发Range请求: ${rangeHeader}`);
      }

      const response = await fetch(telegramFileUrl, {
        method: request.method,
        headers: headers
      });

      if (!response.ok) {
        console.error(`Telegram API响应错误: ${response.status} ${response.statusText}`);
        return new Response(JSON.stringify({
          error: "文件获取失败",
          status: response.status,
          statusText: response.statusText,
          fileId: fileId
        }), {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // 创建响应头
      const responseHeaders = new Headers();

      // 复制重要的响应头
      const importantHeaders = [
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag',
        'cache-control'
      ];

      importantHeaders.forEach(headerName => {
        const value = response.headers.get(headerName);
        if (value) {
          responseHeaders.set(headerName, value);
        }
      });

      // 智能设置 Content-Type，特别优化视频文件
      const contentType = response.headers.get('content-type');
      if (!contentType || contentType === 'application/octet-stream') {
        // 根据文件路径推断正确的 Content-Type
        if (filePath.toLowerCase().includes('.mp4')) {
          responseHeaders.set('Content-Type', 'video/mp4');
        } else if (filePath.toLowerCase().includes('.mov')) {
          responseHeaders.set('Content-Type', 'video/quicktime');
        } else if (filePath.toLowerCase().includes('.avi')) {
          responseHeaders.set('Content-Type', 'video/x-msvideo');
        } else if (filePath.toLowerCase().includes('.webm')) {
          responseHeaders.set('Content-Type', 'video/webm');
        } else if (filePath.toLowerCase().includes('.mkv')) {
          responseHeaders.set('Content-Type', 'video/x-matroska');
        } else if (filePath.toLowerCase().includes('.jpg') || filePath.toLowerCase().includes('.jpeg')) {
          responseHeaders.set('Content-Type', 'image/jpeg');
        } else if (filePath.toLowerCase().includes('.png')) {
          responseHeaders.set('Content-Type', 'image/png');
        } else if (filePath.toLowerCase().includes('.gif')) {
          responseHeaders.set('Content-Type', 'image/gif');
        } else if (filePath.toLowerCase().includes('.pdf')) {
          responseHeaders.set('Content-Type', 'application/pdf');
        } else {
          responseHeaders.set('Content-Type', contentType || 'application/octet-stream');
        }
      } else {
        responseHeaders.set('Content-Type', contentType);
      }

      // 从文件路径中提取文件名和扩展名
      const finalContentType = responseHeaders.get('Content-Type');
      let fileName = 'file';
      let fileExtension = '';

      if (filePath) {
        // 从文件路径中提取文件名和扩展名 (例如: "videos/file_137.mp4" -> "file_137.mp4")
        const pathParts = filePath.split('/');
        const fullFileName = pathParts[pathParts.length - 1];

        if (fullFileName) {
          const nameParts = fullFileName.split('.');

          if (nameParts.length > 1) {
            fileName = nameParts.slice(0, -1).join('.');
            fileExtension = '.' + nameParts[nameParts.length - 1];
          } else {
            fileName = fullFileName;
          }
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
        } else if (finalContentType.startsWith('application/pdf')) {
          fileExtension = '.pdf';
        }
      }

      const fullFileName = fileName + fileExtension;

      // 针对 Notion 优化的 Content-Disposition 设置
      if (finalContentType && finalContentType.startsWith('video/')) {
        // 对于视频文件，设置为 inline 以便 Notion 嵌入显示
        responseHeaders.set('Content-Disposition', `inline; filename="${fullFileName}"`);

        // 添加视频相关的头部，帮助 Notion 识别和流式传输
        responseHeaders.set('Accept-Ranges', 'bytes');
      } else if (finalContentType && finalContentType.startsWith('image/')) {
        // 对于图片文件，也设置为 inline
        responseHeaders.set('Content-Disposition', `inline; filename="${fullFileName}"`);
      } else {
        // 对于其他文件类型，设置为 attachment
        responseHeaders.set('Content-Disposition', `attachment; filename="${fullFileName}"`);
      }

      // 添加CORS头
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');

      // 添加缓存头
      responseHeaders.set('Cache-Control', 'public, max-age=3600');

      console.log(`文件代理成功: ${fullFileName}, Content-Type: ${finalContentType}`);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error("文件代理错误:", error);
      return new Response(JSON.stringify({
        error: "代理服务错误",
        message: (error as Error).message,
        fileId: fileId
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }











  // 其他路由处理...
  return new Response("Not Found", { status: 404 });
};

export default {
  fetch: worker
};
