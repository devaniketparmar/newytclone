import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VideoContent {
  title: string;
  description: string;
  category?: string;
  duration: number;
  existingHashtags?: string[];
}

interface RecommendationContext {
  userId?: string;
  channelId?: string;
  videoId?: string;
  category?: string;
  trendingHashtags?: string[];
  userPreferences?: string[];
}

interface HashtagRecommendation {
  hashtag: string;
  confidence: number;
  reason: string;
  category: 'trending' | 'content' | 'category' | 'similar' | 'popular';
  usageCount: number;
  trendingScore: number;
}

/**
 * AI-powered hashtag recommendation engine
 */
export class HashtagRecommendationEngine {
  
  /**
   * Generate hashtag recommendations for a video
   */
  async generateRecommendations(
    content: VideoContent,
    context: RecommendationContext = {},
    maxRecommendations: number = 10
  ): Promise<HashtagRecommendation[]> {
    try {
      const recommendations: HashtagRecommendation[] = [];

      // 1. Content-based recommendations
      const contentRecommendations = await this.getContentBasedRecommendations(content);
      recommendations.push(...contentRecommendations);

      // 2. Category-based recommendations
      if (content.category) {
        const categoryRecommendations = await this.getCategoryBasedRecommendations(content.category);
        recommendations.push(...categoryRecommendations);
      }

      // 3. Trending hashtag recommendations
      const trendingRecommendations = await this.getTrendingRecommendations(context);
      recommendations.push(...trendingRecommendations);

      // 4. Similar video recommendations
      const similarRecommendations = await this.getSimilarVideoRecommendations(content, context);
      recommendations.push(...similarRecommendations);

      // 5. Popular hashtag recommendations
      const popularRecommendations = await this.getPopularRecommendations(context);
      recommendations.push(...popularRecommendations);

      // 6. User preference recommendations
      if (context.userId) {
        const userRecommendations = await this.getUserPreferenceRecommendations(context.userId, content);
        recommendations.push(...userRecommendations);
      }

      // Remove duplicates and existing hashtags
      const uniqueRecommendations = this.removeDuplicatesAndExisting(
        recommendations,
        content.existingHashtags || []
      );

      // Sort by confidence score
      const sortedRecommendations = uniqueRecommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxRecommendations);

      return sortedRecommendations;
    } catch (error) {
      console.error('Error generating hashtag recommendations:', error);
      return [];
    }
  }

  /**
   * Content-based recommendations using NLP analysis
   */
  private async getContentBasedRecommendations(content: VideoContent): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    // Extract keywords from title and description
    const keywords = this.extractKeywords(content.title + ' ' + content.description);
    
    for (const keyword of keywords) {
      const hashtag = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (hashtag.length >= 3) {
        const tag = await prisma.tag.findUnique({
          where: { name: hashtag },
        });

        if (tag) {
          recommendations.push({
            hashtag: tag.name,
            confidence: this.calculateContentConfidence(keyword, content),
            reason: `Based on content analysis: "${keyword}"`,
            category: 'content',
            usageCount: tag.usageCount,
            trendingScore: Number(tag.trendingScore),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Category-based recommendations
   */
  private async getCategoryBasedRecommendations(category: string): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    // Category-specific hashtag mappings
    const categoryMappings: { [key: string]: string[] } = {
      'Gaming': ['gaming', 'gameplay', 'streaming', 'esports', 'pc', 'console', 'mobile'],
      'Music': ['music', 'song', 'cover', 'original', 'instrumental', 'vocal', 'performance'],
      'Education': ['tutorial', 'learning', 'education', 'howto', 'tips', 'guide', 'lesson'],
      'Entertainment': ['funny', 'comedy', 'entertainment', 'viral', 'meme', 'reaction'],
      'Technology': ['tech', 'technology', 'review', 'unboxing', 'gadget', 'innovation'],
      'Sports': ['sports', 'fitness', 'workout', 'training', 'athlete', 'competition'],
      'Food': ['cooking', 'recipe', 'food', 'kitchen', 'chef', 'baking', 'restaurant'],
      'Travel': ['travel', 'trip', 'vacation', 'adventure', 'explore', 'destination'],
      'Fashion': ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'clothing'],
      'Art': ['art', 'drawing', 'painting', 'creative', 'design', 'illustration'],
    };

    const categoryHashtags = categoryMappings[category] || [];
    
    for (const hashtagName of categoryHashtags) {
      const tag = await prisma.tag.findUnique({
        where: { name: hashtagName },
      });

      if (tag) {
        recommendations.push({
          hashtag: tag.name,
          confidence: 0.8,
          reason: `Popular in ${category} category`,
          category: 'category',
          usageCount: tag.usageCount,
          trendingScore: Number(tag.trendingScore),
        });
      }
    }

    return recommendations;
  }

  /**
   * Trending hashtag recommendations
   */
  private async getTrendingRecommendations(context: RecommendationContext): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    const trendingHashtags = await prisma.tag.findMany({
      where: {
        trendingScore: { gt: 100 },
        usageCount: { gt: 10 },
      },
      orderBy: { trendingScore: 'desc' },
      take: 20,
    });

    for (const tag of trendingHashtags) {
      recommendations.push({
        hashtag: tag.name,
        confidence: Math.min(0.7, Number(tag.trendingScore) / 1000),
        reason: `Currently trending (score: ${Number(tag.trendingScore).toFixed(0)})`,
        category: 'trending',
        usageCount: tag.usageCount,
        trendingScore: Number(tag.trendingScore),
      });
    }

    return recommendations;
  }

  /**
   * Similar video recommendations
   */
  private async getSimilarVideoRecommendations(
    content: VideoContent,
    context: RecommendationContext
  ): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    // Find videos with similar titles or descriptions
    const similarVideos = await prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: content.title.split(' ')[0], mode: 'insensitive' } },
          { description: { contains: content.title.split(' ')[0], mode: 'insensitive' } },
        ],
        status: 'READY',
        privacy: 'PUBLIC',
      },
      include: {
        videoTags: {
          include: {
            tag: true,
          },
        },
      },
      take: 10,
    });

    const hashtagCounts: { [key: string]: number } = {};
    
    for (const video of similarVideos) {
      for (const videoTag of video.videoTags) {
        const hashtagName = videoTag.tag.name;
        hashtagCounts[hashtagName] = (hashtagCounts[hashtagName] || 0) + 1;
      }
    }

    for (const [hashtagName, count] of Object.entries(hashtagCounts)) {
      const tag = await prisma.tag.findUnique({
        where: { name: hashtagName },
      });

      if (tag && count >= 2) {
        recommendations.push({
          hashtag: tag.name,
          confidence: Math.min(0.6, count / similarVideos.length),
          reason: `Used in ${count} similar videos`,
          category: 'similar',
          usageCount: tag.usageCount,
          trendingScore: Number(tag.trendingScore),
        });
      }
    }

    return recommendations;
  }

  /**
   * Popular hashtag recommendations
   */
  private async getPopularRecommendations(context: RecommendationContext): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    const popularHashtags = await prisma.tag.findMany({
      where: {
        usageCount: { gt: 50 },
        followerCount: { gt: 10 },
      },
      orderBy: { usageCount: 'desc' },
      take: 15,
    });

    for (const tag of popularHashtags) {
      recommendations.push({
        hashtag: tag.name,
        confidence: Math.min(0.5, tag.usageCount / 1000),
        reason: `Popular hashtag (${tag.usageCount} uses)`,
        category: 'popular',
        usageCount: tag.usageCount,
        trendingScore: Number(tag.trendingScore),
      });
    }

    return recommendations;
  }

  /**
   * User preference recommendations
   */
  private async getUserPreferenceRecommendations(
    userId: string,
    content: VideoContent
  ): Promise<HashtagRecommendation[]> {
    const recommendations: HashtagRecommendation[] = [];
    
    // Get user's followed hashtags
    const followedHashtags = await prisma.hashtagFollow.findMany({
      where: { userId },
      include: {
        hashtag: true,
      },
    });

    // Get user's video history
    const userVideos = await prisma.video.findMany({
      where: {
        channel: { userId },
        status: 'READY',
      },
      include: {
        videoTags: {
          include: {
            tag: true,
          },
        },
      },
      take: 20,
    });

    const userHashtagCounts: { [key: string]: number } = {};
    
    for (const video of userVideos) {
      for (const videoTag of video.videoTags) {
        const hashtagName = videoTag.tag.name;
        userHashtagCounts[hashtagName] = (userHashtagCounts[hashtagName] || 0) + 1;
      }
    }

    // Recommend based on user's preferences
    for (const follow of followedHashtags) {
      const tag = follow.hashtag;
      recommendations.push({
        hashtag: tag.name,
        confidence: 0.7,
        reason: 'Based on your followed hashtags',
        category: 'trending',
        usageCount: tag.usageCount,
        trendingScore: Number(tag.trendingScore),
      });
    }

    for (const [hashtagName, count] of Object.entries(userHashtagCounts)) {
      if (count >= 2) {
        const tag = await prisma.tag.findUnique({
          where: { name: hashtagName },
        });

        if (tag) {
          recommendations.push({
            hashtag: tag.name,
            confidence: Math.min(0.6, count / userVideos.length),
            reason: `You've used this hashtag ${count} times`,
            category: 'similar',
            usageCount: tag.usageCount,
            trendingScore: Number(tag.trendingScore),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Extract keywords from text using simple NLP
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);

    // Extract words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word));

    // Count word frequency
    const wordCounts: { [key: string]: number } = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    // Return top keywords
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calculate confidence score for content-based recommendations
   */
  private calculateContentConfidence(keyword: string, content: VideoContent): number {
    let confidence = 0.5;
    
    // Boost confidence if keyword appears in title
    if (content.title.toLowerCase().includes(keyword.toLowerCase())) {
      confidence += 0.3;
    }
    
    // Boost confidence if keyword appears in description
    if (content.description.toLowerCase().includes(keyword.toLowerCase())) {
      confidence += 0.2;
    }
    
    // Boost confidence for longer keywords
    if (keyword.length >= 5) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Remove duplicates and existing hashtags
   */
  private removeDuplicatesAndExisting(
    recommendations: HashtagRecommendation[],
    existingHashtags: string[]
  ): HashtagRecommendation[] {
    const seen = new Set<string>();
    const existing = new Set(existingHashtags.map(tag => tag.toLowerCase()));
    
    return recommendations.filter(rec => {
      const hashtagLower = rec.hashtag.toLowerCase();
      if (seen.has(hashtagLower) || existing.has(hashtagLower)) {
        return false;
      }
      seen.add(hashtagLower);
      return true;
    });
  }

  /**
   * Get hashtag suggestions for autocomplete
   */
  async getSuggestions(query: string, limit: number = 10): Promise<HashtagRecommendation[]> {
    try {
      const suggestions = await prisma.tag.findMany({
        where: {
          name: {
            contains: query.toLowerCase(),
            mode: 'insensitive',
          },
          usageCount: { gt: 0 },
        },
        orderBy: [
          { usageCount: 'desc' },
          { trendingScore: 'desc' },
        ],
        take: limit,
      });

      return suggestions.map(tag => ({
        hashtag: tag.name,
        confidence: Math.min(0.9, tag.usageCount / 100),
        reason: `${tag.usageCount} uses`,
        category: 'popular',
        usageCount: tag.usageCount,
        trendingScore: Number(tag.trendingScore),
      }));
    } catch (error) {
      console.error('Error getting hashtag suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze hashtag performance and suggest optimizations
   */
  async analyzeHashtagPerformance(videoId: string): Promise<{
    currentHashtags: HashtagRecommendation[];
    suggestedAdditions: HashtagRecommendation[];
    suggestedRemovals: string[];
    performanceScore: number;
  }> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          videoTags: {
            include: {
              tag: true,
            },
          },
          channel: true,
          _count: {
            select: {
              views: true,
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      const currentHashtags = video.videoTags.map(vt => ({
        hashtag: vt.tag.name,
        confidence: 1.0,
        reason: 'Currently used',
        category: 'content' as const,
        usageCount: vt.tag.usageCount,
        trendingScore: Number(vt.tag.trendingScore),
      }));

      // Generate new recommendations
      const content: VideoContent = {
        title: video.title,
        description: video.description || '',
        category: video.category,
        duration: video.duration,
        existingHashtags: currentHashtags.map(h => h.hashtag),
      };

      const context: RecommendationContext = {
        userId: video.channel.userId,
        channelId: video.channel.id,
        videoId: video.id,
        category: video.category,
      };

      const suggestedAdditions = await this.generateRecommendations(content, context, 5);

      // Calculate performance score
      const totalViews = video._count.views;
      const totalEngagement = video._count.likes + video._count.comments;
      const performanceScore = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      // Suggest removals for low-performing hashtags
      const suggestedRemovals: string[] = [];
      for (const hashtag of currentHashtags) {
        if (hashtag.usageCount < 10 && hashtag.trendingScore < 50) {
          suggestedRemovals.push(hashtag.hashtag);
        }
      }

      return {
        currentHashtags,
        suggestedAdditions,
        suggestedRemovals,
        performanceScore,
      };
    } catch (error) {
      console.error('Error analyzing hashtag performance:', error);
      throw error;
    }
  }
}

export default HashtagRecommendationEngine;
