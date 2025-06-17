/**
 * 文件处理工具函数
 */

import { TelegramApiResponse, TelegramFile, FileType } from '../types';

/**
 * 获取Telegram文件信息
 */
export async function getFileInfo(botToken: string, fileId: string): Promise<string> {
  try {
    console.log(`获取文件信息: ${fileId}`);
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    
    if (!response.ok) {
      const errorData: TelegramApiResponse = await response.json();
      console.error("获取文件信息失败:", errorData);

      // 提取 Telegram API 的错误信息
      const telegramError = errorData.description || "未知错误";
      console.error("Telegram API 错误:", telegramError);

      throw new Error(`获取文件信息失败: ${telegramError}`);
    }
    
    const result: TelegramApiResponse<TelegramFile> = await response.json();
    console.log("获取文件信息成功:", JSON.stringify(result));
    
    if (!result.ok || !result.result || !result.result.file_path) {
      throw new Error("无效的文件信息响应");
    }
    
    return result.result.file_path;
  } catch (error) {
    console.error("获取文件信息时出错:", error);
    throw error;
  }
}

/**
 * 获取文件URL（异步版本）
 */
export async function getFileUrl(
  workerDomain: string, 
  fileId: string, 
  botToken?: string
): Promise<string> {
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
      console.log(`无法获取文件信息，使用默认文件名: ${(error as Error).message}`);
    }
  }

  // 默认使用 image.jpg 作为文件名
  return `${workerDomain}/file/${fileId}/image.jpg`;
}

/**
 * 获取文件URL（同步版本，保持向后兼容）
 */
export function getFileUrlSync(workerDomain: string, fileId: string): string {
  return `${workerDomain}/file/${fileId}/image.jpg`;
}

/**
 * 智能获取文件URL，根据文件类型生成正确的扩展名
 */
export async function getSmartFileUrl(
  workerDomain: string, 
  fileId: string, 
  botToken: string, 
  fileType: FileType = 'image'
): Promise<string> {
  try {
    // 从 Telegram API 获取真实的文件路径
    const filePath = await getFileInfo(botToken, fileId);
    if (filePath) {
      // 从文件路径提取文件名 (例如: "photos/file_137.jpg" -> "file_137.jpg")
      const pathParts = filePath.split('/');
      let fileName = pathParts[pathParts.length - 1];

      // 检查文件名是否包含扩展名
      if (fileName && fileName.includes('.')) {
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
        let extension: string;
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
    console.log(`无法获取文件信息，使用默认文件名: ${(error as Error).message}`);
  }

  // 如果无法获取真实文件名，根据文件类型生成默认文件名
  let defaultFileName: string;
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

/**
 * 获取Telegram文件直接URL
 */
export function getTelegramFileUrl(botToken: string, filePath: string): string {
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}
