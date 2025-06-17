/**
 * 媒体组管理工具
 */

import { MediaGroupInfo, DEFAULT_CONFIG } from '../types';

// 媒体组缓存
const mediaGroupMap = new Map<string, MediaGroupInfo>();

/**
 * 获取媒体组信息
 */
export function getMediaGroupInfo(mediaGroupId: string): MediaGroupInfo | null {
  const now = Date.now();
  
  // 清理过期的媒体组
  for (const [id, info] of mediaGroupMap.entries()) {
    if (now - info.timestamp > DEFAULT_CONFIG.mediaGroupExpiry) {
      mediaGroupMap.delete(id);
    }
  }
  
  return mediaGroupMap.get(mediaGroupId) || null;
}

/**
 * 保存媒体组信息
 */
export function saveMediaGroupInfo(mediaGroupId: string, info: MediaGroupInfo): void {
  mediaGroupMap.set(mediaGroupId, info);
}

/**
 * 删除媒体组信息
 */
export function deleteMediaGroupInfo(mediaGroupId: string): boolean {
  return mediaGroupMap.delete(mediaGroupId);
}

/**
 * 清理所有过期的媒体组
 */
export function cleanupExpiredMediaGroups(): number {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [id, info] of mediaGroupMap.entries()) {
    if (now - info.timestamp > DEFAULT_CONFIG.mediaGroupExpiry) {
      mediaGroupMap.delete(id);
      cleanedCount++;
    }
  }
  
  console.log(`清理了 ${cleanedCount} 个过期的媒体组`);
  return cleanedCount;
}

/**
 * 更新媒体组信息，添加新的媒体URL
 */
export function updateMediaGroupInfo(
  mediaGroupId: string,
  newImageUrls: string[] = [],
  newVideoUrls: string[] = [],
  newFileUrls: string[] = []
): MediaGroupInfo | null {
  const existingInfo = mediaGroupMap.get(mediaGroupId);
  if (!existingInfo) {
    console.log(`媒体组 ${mediaGroupId} 不存在，无法更新`);
    return null;
  }

  // 更新媒体URL列表
  const updatedInfo: MediaGroupInfo = {
    ...existingInfo,
    imageUrls: [...existingInfo.imageUrls, ...newImageUrls],
    videoUrls: [...existingInfo.videoUrls, ...newVideoUrls],
    fileUrls: [...existingInfo.fileUrls, ...newFileUrls],
    timestamp: Date.now() // 更新时间戳
  };

  mediaGroupMap.set(mediaGroupId, updatedInfo);
  console.log(`媒体组 ${mediaGroupId} 更新成功，新增图片: ${newImageUrls.length}, 视频: ${newVideoUrls.length}, 文件: ${newFileUrls.length}`);

  return updatedInfo;
}

/**
 * 获取媒体组统计信息
 */
export function getMediaGroupStats(): {
  total: number;
  active: number;
  expired: number;
} {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const [, info] of mediaGroupMap.entries()) {
    if (now - info.timestamp > DEFAULT_CONFIG.mediaGroupExpiry) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: mediaGroupMap.size,
    active,
    expired
  };
}
