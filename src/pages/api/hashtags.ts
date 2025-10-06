import { NextApiRequest, NextApiResponse } from 'next';
import { 
  getTrendingHashtags, 
  searchVideosByHashtag, 
  getHashtagSuggestions, 
  getHashtagStats,
  extractHashtags 
} from '@/utils/hashtagUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      action = 'trending',
      hashtag,
      query,
      limit = '20',
      offset = '0'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offsetNum = Math.max(parseInt(offset as string, 10), 0);

    switch (action) {
      case 'trending':
        const trendingHashtags = await getTrendingHashtags(limitNum);
        return res.status(200).json({
          success: true,
          data: {
            hashtags: trendingHashtags,
            pagination: {
              total: trendingHashtags.length,
              limit: limitNum,
              offset: offsetNum,
              hasMore: false
            }
          }
        });

      case 'search':
        if (!hashtag) {
          return res.status(400).json({
            success: false,
            error: 'Hashtag parameter is required for search'
          });
        }

        const videos = await searchVideosByHashtag(hashtag as string, limitNum, offsetNum);
        return res.status(200).json({
          success: true,
          data: {
            videos,
            hashtag: hashtag as string,
            pagination: {
              total: videos.length,
              limit: limitNum,
              offset: offsetNum,
              hasMore: videos.length === limitNum
            }
          }
        });

      case 'suggestions':
        const suggestions = await getHashtagSuggestions(query as string || '', limitNum);
        return res.status(200).json({
          success: true,
          data: {
            suggestions,
            query: query as string || ''
          }
        });

      case 'stats':
        const stats = await getHashtagStats();
        return res.status(200).json({
          success: true,
          data: stats
        });

      case 'extract':
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'Query parameter is required for extract'
          });
        }

        const extractedHashtags = extractHashtags(query as string);
        return res.status(200).json({
          success: true,
          data: {
            hashtags: extractedHashtags,
            text: query as string
          }
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: trending, search, suggestions, stats, extract'
        });
    }

  } catch (error) {
    console.error('Error in hashtag API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process hashtag request'
    });
  }
}
