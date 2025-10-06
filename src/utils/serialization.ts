// Utility functions for handling BigInt serialization in API responses
export class SerializationUtils {
  /**
   * Convert BigInt values to numbers for JSON serialization
   * @param obj - Object that may contain BigInt values
   * @returns Object with BigInt values converted to numbers
   */
  static convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      return Number(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToNumber(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }

    return obj;
  }

  /**
   * Format video data for API response (handles BigInt conversion)
   * @param video - Video object from database
   * @returns Formatted video object
   */
  static formatVideo(video: any) {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      fileSize: video.fileSize ? Number(video.fileSize) : 0,
      resolution: video.resolution,
      categoryId: video.categoryId,
      privacy: video.privacy,
      status: video.status,
      viewCount: video.viewCount ? Number(video.viewCount) : 0,
      likeCount: video.likeCount || 0,
      dislikeCount: video.dislikeCount || 0,
      commentCount: video.commentCount || 0,
      createdAt: video.createdAt?.toISOString(),
      updatedAt: video.updatedAt?.toISOString(),
      publishedAt: video.publishedAt?.toISOString(),
      scheduledAt: video.scheduledAt?.toISOString(),
      metadata: video.metadata,
      processingStatus: video.processingStatus,
      channel: video.channel ? this.formatChannel(video.channel) : undefined
    };
  }

  /**
   * Format channel data for API response (handles BigInt conversion)
   * @param channel - Channel object from database
   * @returns Formatted channel object
   */
  static formatChannel(channel: any) {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      customUrl: channel.customUrl,
      avatarUrl: channel.avatarUrl || '/uploads/thumbnails/test-avatar.svg', // Fallback avatar
      bannerUrl: channel.bannerUrl,
      trailerVideoId: channel.trailerVideoId,
      subscriberCount: channel.subscriberCount ? Number(channel.subscriberCount) : 0,
      videoCount: channel.videoCount ? Number(channel.videoCount) : 0,
      viewCount: channel.viewCount ? Number(channel.viewCount) : 0,
      verified: channel.verified,
      createdAt: channel.createdAt?.toISOString(),
      updatedAt: channel.updatedAt?.toISOString(),
      settings: channel.settings,
      user: channel.user
    };
  }

  /**
   * Format user data for API response
   * @param user - User object from database
   * @returns Formatted user object
   */
  static formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      location: user.location,
      websiteUrl: user.websiteUrl,
      verified: user.verified,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      status: user.status,
      privacySettings: user.privacySettings,
      notificationSettings: user.notificationSettings
    };
  }
}

