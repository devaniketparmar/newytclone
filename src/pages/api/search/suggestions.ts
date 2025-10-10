import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q: query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const suggestions = [];

    // Get video title suggestions
    try {
      const videoSuggestions = await prisma.video.findMany({
        where: {
          title: {
            contains: query,
            mode: 'insensitive'
          },
          status: 'PUBLISHED',
          privacy: 'PUBLIC'
        },
        select: {
          id: true,
          title: true,
          viewCount: true,
          thumbnailUrl: true
        },
        orderBy: {
          viewCount: 'desc'
        },
        take: 3
      });

      // Format video suggestions
      videoSuggestions.forEach(video => {
        suggestions.push({
          id: `video-${video.id}`,
          text: video.title,
          type: 'video',
          thumbnail: video.thumbnailUrl,
          viewCount: Number(video.viewCount)
        });
      });
    } catch (videoError) {
      console.log('No video suggestions found:', videoError);
    }

    // Get channel name suggestions
    try {
      const channelSuggestions = await prisma.channel.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          subscriberCount: true,
          avatarUrl: true
        },
        orderBy: {
          subscriberCount: 'desc'
        },
        take: 2
      });

      // Format channel suggestions
      channelSuggestions.forEach(channel => {
        suggestions.push({
          id: `channel-${channel.id}`,
          text: channel.name,
          type: 'channel',
          thumbnail: channel.avatarUrl,
          subscriberCount: Number(channel.subscriberCount)
        });
      });
    } catch (channelError) {
      console.log('No channel suggestions found:', channelError);
    }

    // Get popular search terms (simulated)
    const popularTerms = [
      'python tutorial',
      'javascript basics',
      'react tutorial',
      'node.js course',
      'web development',
      'machine learning',
      'data science',
      'programming tips',
      'coding interview',
      'software engineering'
    ].filter(term => 
      term.toLowerCase().includes(query.toLowerCase()) && 
      term.toLowerCase() !== query.toLowerCase()
    ).slice(0, 3);

    // Add popular search terms
    popularTerms.forEach(term => {
      suggestions.push({
        id: `query-${term}`,
        text: term,
        type: 'query'
      });
    });

    // Sort suggestions by relevance (exact matches first, then partial matches)
    suggestions.sort((a, b) => {
      const aExact = a.text.toLowerCase() === query.toLowerCase();
      const bExact = b.text.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStartsWith = a.text.toLowerCase().startsWith(query.toLowerCase());
      const bStartsWith = b.text.toLowerCase().startsWith(query.toLowerCase());
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return 0;
    });

    return res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 8) // Limit to 8 suggestions
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      suggestions: []
    });
  }
}
