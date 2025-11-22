import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      action = 'discover',
      genre,
      mood,
      decade,
      sort = 'trending',
      limit = '20',
      offset = '0',
      search,
      artist,
      album
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offsetNum = Math.max(parseInt(offset as string, 10), 0);

    const prisma = await getInitializedPrisma();

    switch (action) {
      case 'discover':
        return handleMusicDiscovery(req, res, prisma, {
          genre: genre as string,
          mood: mood as string,
          decade: decade as string,
          sort: sort as string,
          limit: limitNum,
          offset: offsetNum,
          search: search as string,
          artist: artist as string,
          album: album as string
        });

      case 'trending':
        return handleTrendingMusic(req, res, prisma, limitNum);

      case 'genres':
        return handleGetGenres(req, res, prisma);

      case 'artists':
        return handleGetArtists(req, res, prisma, limitNum);

      case 'albums':
        return handleGetAlbums(req, res, prisma, limitNum);

      case 'recommendations':
        return handleGetRecommendations(req, res, prisma, limitNum);

      case 'search':
        return handleMusicSearch(req, res, prisma, {
          query: search as string,
          limit: limitNum,
          offset: offsetNum
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: discover, trending, genres, artists, albums, recommendations, search'
        });
    }

  } catch (error) {
    console.error('Error in music API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process music request'
    });
  }
}

async function handleMusicDiscovery(
  req: NextApiRequest, 
  res: NextApiResponse, 
  prisma: any,
  options: {
    genre?: string;
    mood?: string;
    decade?: string;
    sort: string;
    limit: number;
    offset: number;
    search?: string;
    artist?: string;
    album?: string;
  }
) {
  const { genre, mood, decade, sort, limit, offset, search, artist, album } = options;

  // Build where clause for music videos
  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC'
  };

  // Add category filter for music
  const musicCategory = await prisma.category.findFirst({
    where: { name: { contains: 'Music', mode: 'insensitive' } }
  });

  if (musicCategory) {
    where.categoryId = musicCategory.id;
  } else {
    // Fallback: filter by title/description containing music keywords
    where.OR = [
      { title: { contains: 'music', mode: 'insensitive' } },
      { title: { contains: 'song', mode: 'insensitive' } },
      { title: { contains: 'album', mode: 'insensitive' } },
      { description: { contains: 'music', mode: 'insensitive' } },
      { description: { contains: 'song', mode: 'insensitive' } }
    ];
  }

  // Add search filter
  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { channel: { name: { contains: search, mode: 'insensitive' } } }
        ]
      }
    ];
  }

  // Add artist filter
  if (artist) {
    where.channel = { name: { contains: artist, mode: 'insensitive' } };
  }

  // Build orderBy clause
  let orderBy: any = {};
  switch (sort) {
    case 'trending':
      orderBy = [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { publishedAt: 'desc' }
      ];
      break;
    case 'newest':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { publishedAt: 'asc' };
      break;
    case 'popular':
      orderBy = { viewCount: 'desc' };
      break;
    case 'liked':
      orderBy = { likeCount: 'desc' };
      break;
    case 'duration':
      orderBy = { duration: 'desc' };
      break;
    default:
      orderBy = [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ];
  }

  // Get music videos with channel and category info
  const musicVideos = await prisma.video.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
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
      category: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  });

  // Get total count for pagination
  const totalCount = await prisma.video.count({ where });

  // Transform data to include music-specific fields
  const transformedVideos = musicVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [], // Will be populated if needed
    // Music-specific fields
    artist: video.channel.name,
    genre: detectGenre(video.title, video.description),
    album: detectAlbum(video.title),
    year: video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear(),
    mood: detectMood(video.title, video.description),
    decade: Math.floor((video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear()) / 10) * 10
  }));

  // Apply additional filters
  let filteredVideos = transformedVideos;

  if (genre) {
    filteredVideos = filteredVideos.filter(video => 
      video.genre.toLowerCase().includes(genre.toLowerCase())
    );
  }

  if (mood) {
    filteredVideos = filteredVideos.filter(video => 
      video.mood.toLowerCase().includes(mood.toLowerCase())
    );
  }

  if (decade) {
    const decadeNum = parseInt(decade);
    filteredVideos = filteredVideos.filter(video => 
      video.decade === decadeNum
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      videos: filteredVideos,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        genre,
        mood,
        decade,
        sort
      }
    }
  });
}

async function handleTrendingMusic(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get trending music videos from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const musicCategory = await prisma.category.findFirst({
    where: { name: { contains: 'Music', mode: 'insensitive' } }
  });

  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    publishedAt: { gte: sevenDaysAgo }
  };

  if (musicCategory) {
    where.categoryId = musicCategory.id;
  } else {
    where.OR = [
      { title: { contains: 'music', mode: 'insensitive' } },
      { title: { contains: 'song', mode: 'insensitive' } },
      { description: { contains: 'music', mode: 'insensitive' } }
    ];
  }

  const trendingVideos = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const transformedVideos = trendingVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    artist: video.channel.name,
    genre: detectGenre(video.title, video.description),
    album: detectAlbum(video.title),
    year: video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear(),
    mood: detectMood(video.title, video.description),
    decade: Math.floor((video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear()) / 10) * 10
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos
    }
  });
}

async function handleGetGenres(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  const genres = [
    { id: 'pop', name: 'Pop', description: 'Popular music hits', color: '#ec4899', icon: '🎵' },
    { id: 'rock', name: 'Rock', description: 'Rock and alternative music', color: '#6b7280', icon: '🎸' },
    { id: 'hip-hop', name: 'Hip-Hop', description: 'Hip-hop and rap music', color: '#7c3aed', icon: '🎤' },
    { id: 'electronic', name: 'Electronic', description: 'Electronic and dance music', color: '#3b82f6', icon: '🎧' },
    { id: 'classical', name: 'Classical', description: 'Classical and orchestral music', color: '#eab308', icon: '🎼' },
    { id: 'jazz', name: 'Jazz', description: 'Jazz and blues music', color: '#f97316', icon: '🎷' },
    { id: 'country', name: 'Country', description: 'Country and folk music', color: '#22c55e', icon: '🤠' },
    { id: 'rnb', name: 'R&B', description: 'Rhythm and blues', color: '#ef4444', icon: '💫' },
    { id: 'reggae', name: 'Reggae', description: 'Reggae and Caribbean music', color: '#10b981', icon: '🌴' },
    { id: 'blues', name: 'Blues', description: 'Blues and soul music', color: '#1e40af', icon: '🎸' },
    { id: 'folk', name: 'Folk', description: 'Folk and acoustic music', color: '#a3a3a3', icon: '🪕' },
    { id: 'indie', name: 'Indie', description: 'Independent and alternative music', color: '#8b5cf6', icon: '🎨' }
  ];

  return res.status(200).json({
    success: true,
    data: {
      genres
    }
  });
}

async function handleGetArtists(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get channels that have music videos
  const musicCategory = await prisma.category.findFirst({
    where: { name: { contains: 'Music', mode: 'insensitive' } }
  });

  const where: any = {
    videos: {
      some: {
        status: 'READY',
        privacy: 'PUBLIC'
      }
    }
  };

  if (musicCategory) {
    where.videos.some.categoryId = musicCategory.id;
  } else {
    where.videos.some.OR = [
      { title: { contains: 'music', mode: 'insensitive' } },
      { title: { contains: 'song', mode: 'insensitive' } }
    ];
  }

  const artists = await prisma.channel.findMany({
    where,
    orderBy: { subscriberCount: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      subscriberCount: true,
      createdAt: true,
      _count: {
        select: {
          videos: {
            where: {
              status: 'READY',
              privacy: 'PUBLIC'
            }
          }
        }
      }
    }
  });

  const transformedArtists = artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    avatarUrl: artist.avatarUrl,
    subscriberCount: Number(artist.subscriberCount),
    videoCount: artist._count.videos,
    createdAt: artist.createdAt,
    isVerified: false // Can be enhanced with user verification
  }));

  return res.status(200).json({
    success: true,
    data: {
      artists: transformedArtists
    }
  });
}

async function handleGetAlbums(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // For now, return mock album data since we don't have a dedicated albums table
  const albums = [
    {
      id: '1',
      title: 'Greatest Hits',
      artist: 'Various Artists',
      year: 2023,
      coverUrl: '/api/placeholder/300/300',
      trackCount: 15,
      duration: 3600,
      genre: 'Pop'
    },
    {
      id: '2',
      title: 'Rock Classics',
      artist: 'Rock Band',
      year: 2022,
      coverUrl: '/api/placeholder/300/300',
      trackCount: 12,
      duration: 3200,
      genre: 'Rock'
    }
  ];

  return res.status(200).json({
    success: true,
    data: {
      albums
    }
  });
}

async function handleGetRecommendations(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get recommended music videos based on view count and recent activity
  const musicCategory = await prisma.category.findFirst({
    where: { name: { contains: 'Music', mode: 'insensitive' } }
  });

  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  };

  if (musicCategory) {
    where.categoryId = musicCategory.id;
  } else {
    where.OR = [
      { title: { contains: 'music', mode: 'insensitive' } },
      { title: { contains: 'song', mode: 'insensitive' } }
    ];
  }

  const recommendedVideos = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const transformedVideos = recommendedVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    artist: video.channel.name,
    genre: detectGenre(video.title, video.description),
    album: detectAlbum(video.title),
    year: video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear(),
    mood: detectMood(video.title, video.description),
    decade: Math.floor((video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear()) / 10) * 10
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos
    }
  });
}

async function handleMusicSearch(req: NextApiRequest, res: NextApiResponse, prisma: any, options: {
  query: string;
  limit: number;
  offset: number;
}) {
  const { query, limit, offset } = options;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const musicCategory = await prisma.category.findFirst({
    where: { name: { contains: 'Music', mode: 'insensitive' } }
  });

  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { channel: { name: { contains: query, mode: 'insensitive' } } }
    ]
  };

  if (musicCategory) {
    where.categoryId = musicCategory.id;
  }

  const searchResults = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    skip: offset,
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const totalCount = await prisma.video.count({ where });

  const transformedVideos = searchResults.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    artist: video.channel.name,
    genre: detectGenre(video.title, video.description),
    album: detectAlbum(video.title),
    year: video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear(),
    mood: detectMood(video.title, video.description),
    decade: Math.floor((video.publishedAt ? new Date(video.publishedAt).getFullYear() : new Date().getFullYear()) / 10) * 10
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      query
    }
  });
}

// Helper functions for music metadata detection
function detectGenre(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('pop') || text.includes('hit')) return 'Pop';
  if (text.includes('rock') || text.includes('guitar')) return 'Rock';
  if (text.includes('hip') || text.includes('rap')) return 'Hip-Hop';
  if (text.includes('electronic') || text.includes('dance') || text.includes('edm')) return 'Electronic';
  if (text.includes('classical') || text.includes('orchestra')) return 'Classical';
  if (text.includes('jazz') || text.includes('blues')) return 'Jazz';
  if (text.includes('country') || text.includes('folk')) return 'Country';
  if (text.includes('r&b') || text.includes('soul')) return 'R&B';
  if (text.includes('reggae')) return 'Reggae';
  if (text.includes('indie')) return 'Indie';
  
  return 'Pop'; // Default genre
}

function detectAlbum(title: string): string {
  // Simple album detection based on title patterns
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length > 1) {
      return parts[0].trim();
    }
  }
  
  return `Album ${Math.floor(Math.random() * 10) + 1}`;
}

function detectMood(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('happy') || text.includes('upbeat') || text.includes('energetic')) return 'Happy';
  if (text.includes('sad') || text.includes('melancholy') || text.includes('emotional')) return 'Sad';
  if (text.includes('chill') || text.includes('relax') || text.includes('calm')) return 'Chill';
  if (text.includes('party') || text.includes('dance') || text.includes('club')) return 'Party';
  if (text.includes('romantic') || text.includes('love') || text.includes('heart')) return 'Romantic';
  if (text.includes('angry') || text.includes('aggressive') || text.includes('intense')) return 'Intense';
  
  return 'Neutral'; // Default mood
}
