import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Hashtag {
  id: string;
  name: string;
  usageCount: number;
  trendingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoWithHashtags {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
  hashtags: Hashtag[];
}

/**
 * Extract hashtags from text content
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  
  // Regex to find hashtags (#word)
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = text.match(hashtagRegex) || [];
  
  // Clean and normalize hashtags
  return matches
    .map(tag => tag.toLowerCase().replace('#', ''))
    .filter(tag => tag.length > 0 && tag.length <= 50) // Max 50 characters
    .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
}

/**
 * Create or update hashtags for a video
 */
export async function createOrUpdateHashtags(videoId: string, hashtags: string[]): Promise<void> {
  if (!hashtags || hashtags.length === 0) return;

  try {
    // Remove existing hashtags for this video
    await prisma.videoTag.deleteMany({
      where: { videoId }
    });

    // Process each hashtag
    for (const hashtagName of hashtags) {
      // Create or update the hashtag
      const hashtag = await prisma.tag.upsert({
        where: { name: hashtagName },
        update: {
          usageCount: {
            increment: 1
          },
          updatedAt: new Date()
        },
        create: {
          name: hashtagName,
          usageCount: 1,
          trendingScore: 0
        }
      });

      // Create video-tag relationship
      await prisma.videoTag.create({
        data: {
          videoId,
          tagId: hashtag.id
        }
      });
    }

    // Update trending scores for all hashtags
    await updateHashtagTrendingScores();
  } catch (error) {
    console.error('Error creating/updating hashtags:', error);
    throw error;
  }
}

/**
 * Update trending scores for hashtags based on recent usage
 */
export async function updateHashtagTrendingScores(): Promise<void> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get hashtags with recent usage
    const hashtags = await prisma.tag.findMany({
      include: {
        videoTags: {
          include: {
            video: {
              select: {
                publishedAt: true,
                viewCount: true,
                likeCount: true,
                commentCount: true
              }
            }
          }
        }
      }
    });

    for (const hashtag of hashtags) {
      let trendingScore = 0;

      // Calculate trending score based on recent videos
      for (const videoTag of hashtag.videoTags) {
        const video = videoTag.video;
        const publishedAt = new Date(video.publishedAt || videoTag.createdAt);
        
        // Only consider videos from the last 7 days
        if (publishedAt >= sevenDaysAgo) {
          const daysSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
          const recencyBoost = Math.max(0, 1 - (daysSincePublished / 7));
          
          const engagementScore = Number(video.viewCount) + 
                                 (Number(video.likeCount) * 10) + 
                                 (Number(video.commentCount) * 5);
          
          trendingScore += engagementScore * recencyBoost;
        }
      }

      // Update the hashtag's trending score
      await prisma.tag.update({
        where: { id: hashtag.id },
        data: { trendingScore }
      });
    }
  } catch (error) {
    console.error('Error updating hashtag trending scores:', error);
  }
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit: number = 20): Promise<Hashtag[]> {
  try {
    const hashtags = await prisma.tag.findMany({
      where: {
        usageCount: {
          gt: 0
        }
      },
      orderBy: [
        { trendingScore: 'desc' },
        { usageCount: 'desc' }
      ],
      take: limit
    });

    return hashtags.map(tag => ({
      id: tag.id,
      name: tag.name,
      usageCount: tag.usageCount,
      trendingScore: Number(tag.trendingScore),
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return [];
  }
}

/**
 * Search videos by hashtag
 */
export async function searchVideosByHashtag(
  hashtagName: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<VideoWithHashtags[]> {
  try {
    const videos = await prisma.video.findMany({
      where: {
        status: 'READY',
        videoTags: {
          some: {
            tag: {
              name: hashtagName
            }
          }
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            userId: true
          }
        },
        videoTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: Number(video.viewCount),
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt.toISOString(),
      publishedAt: video.publishedAt?.toISOString() || video.createdAt.toISOString(),
      status: video.status as 'PROCESSING' | 'READY' | 'FAILED',
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl || '',
        subscriberCount: Number(video.channel.subscriberCount),
        userId: video.channel.userId
      },
      hashtags: video.videoTags.map(vt => ({
        id: vt.tag.id,
        name: vt.tag.name,
        usageCount: vt.tag.usageCount,
        trendingScore: Number(vt.tag.trendingScore),
        createdAt: vt.tag.createdAt,
        updatedAt: vt.tag.updatedAt
      }))
    }));
  } catch (error) {
    console.error('Error searching videos by hashtag:', error);
    return [];
  }
}

/**
 * Get hashtag suggestions based on input
 */
export async function getHashtagSuggestions(query: string, limit: number = 10): Promise<Hashtag[]> {
  if (!query || query.length < 1) {
    return getTrendingHashtags(limit);
  }

  try {
    const hashtags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query.toLowerCase(),
          mode: 'insensitive'
        },
        usageCount: {
          gt: 0
        }
      },
      orderBy: [
        { trendingScore: 'desc' },
        { usageCount: 'desc' }
      ],
      take: limit
    });

    return hashtags.map(tag => ({
      id: tag.id,
      name: tag.name,
      usageCount: tag.usageCount,
      trendingScore: Number(tag.trendingScore),
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching hashtag suggestions:', error);
    return [];
  }
}

/**
 * Get hashtag statistics
 */
export async function getHashtagStats(): Promise<{
  totalHashtags: number;
  totalUsage: number;
  trendingHashtags: Hashtag[];
  recentHashtags: Hashtag[];
}> {
  try {
    const [totalHashtags, totalUsage, trendingHashtags, recentHashtags] = await Promise.all([
      prisma.tag.count(),
      prisma.tag.aggregate({
        _sum: {
          usageCount: true
        }
      }),
      getTrendingHashtags(10),
      prisma.tag.findMany({
        where: {
          usageCount: {
            gt: 0
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    return {
      totalHashtags,
      totalUsage: totalUsage._sum.usageCount || 0,
      trendingHashtags,
      recentHashtags: recentHashtags.map(tag => ({
        id: tag.id,
        name: tag.name,
        usageCount: tag.usageCount,
        trendingScore: Number(tag.trendingScore),
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }))
    };
  } catch (error) {
    console.error('Error fetching hashtag stats:', error);
    return {
      totalHashtags: 0,
      totalUsage: 0,
      trendingHashtags: [],
      recentHashtags: []
    };
  }
}

/**
 * Remove hashtags from a video
 */
export async function removeHashtagsFromVideo(videoId: string): Promise<void> {
  try {
    // Get video tags to update usage counts
    const videoTags = await prisma.videoTag.findMany({
      where: { videoId },
      include: { tag: true }
    });

    // Decrement usage counts
    for (const videoTag of videoTags) {
      await prisma.tag.update({
        where: { id: videoTag.tagId },
        data: {
          usageCount: {
            decrement: 1
          }
        }
      });
    }

    // Remove video-tag relationships
    await prisma.videoTag.deleteMany({
      where: { videoId }
    });

    // Update trending scores
    await updateHashtagTrendingScores();
  } catch (error) {
    console.error('Error removing hashtags from video:', error);
    throw error;
  }
}
