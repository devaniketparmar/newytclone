import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';
import HashtagRecommendationEngine from '@/utils/hashtagRecommendationEngine';

const recommendationEngine = new HashtagRecommendationEngine();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = await getInitializedPrisma();

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const userId = (decoded as any).userId;
    const { action = 'recommend' } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'suggestions':
          return await getHashtagSuggestions(req, res, prisma);
        case 'analyze':
          return await analyzeHashtagPerformance(req, res, prisma, userId);
        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } else if (req.method === 'POST') {
      switch (action) {
        case 'recommend':
          return await generateRecommendations(req, res, prisma, userId);
        case 'batch':
          return await generateBatchRecommendations(req, res, prisma, userId);
        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hashtag recommendations API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getHashtagSuggestions(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  try {
    const { q, limit = '10' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    const suggestions = await recommendationEngine.getSuggestions(q, parseInt(limit as string));

    return res.status(200).json({
      success: true,
      data: {
        suggestions,
        query: q,
        count: suggestions.length,
      },
    });
  } catch (error) {
    console.error('Error getting hashtag suggestions:', error);
    return res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
}

async function generateRecommendations(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { 
      title, 
      description, 
      category, 
      duration, 
      existingHashtags = [],
      maxRecommendations = 10,
      videoId,
      channelId 
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const content = {
      title,
      description: description || '',
      category,
      duration: duration || 0,
      existingHashtags: Array.isArray(existingHashtags) ? existingHashtags : [],
    };

    const context = {
      userId,
      videoId,
      channelId,
      category,
    };

    const recommendations = await recommendationEngine.generateRecommendations(
      content,
      context,
      parseInt(maxRecommendations)
    );

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        content,
        context,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
}

async function generateBatchRecommendations(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ success: false, error: 'Videos array is required' });
    }

    const batchResults = await Promise.all(
      videos.map(async (video: any) => {
        try {
          const content = {
            title: video.title,
            description: video.description || '',
            category: video.category,
            duration: video.duration || 0,
            existingHashtags: video.existingHashtags || [],
          };

          const context = {
            userId,
            videoId: video.id,
            channelId: video.channelId,
            category: video.category,
          };

          const recommendations = await recommendationEngine.generateRecommendations(
            content,
            context,
            5
          );

          return {
            videoId: video.id,
            title: video.title,
            recommendations,
            success: true,
          };
        } catch (error) {
          return {
            videoId: video.id,
            title: video.title,
            recommendations: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        results: batchResults,
        totalProcessed: batchResults.length,
        successful: batchResults.filter(r => r.success).length,
        failed: batchResults.filter(r => !r.success).length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating batch recommendations:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate batch recommendations' });
  }
}

async function analyzeHashtagPerformance(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ success: false, error: 'Video ID is required' });
    }

    // Verify user owns the video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: { userId: true },
        },
      },
    });

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    if (video.channel.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const analysis = await recommendationEngine.analyzeHashtagPerformance(videoId);

    return res.status(200).json({
      success: true,
      data: {
        videoId,
        analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error analyzing hashtag performance:', error);
    return res.status(500).json({ success: false, error: 'Failed to analyze hashtag performance' });
  }
}
