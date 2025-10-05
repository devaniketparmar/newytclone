import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';

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

    const userId = decoded.userId;
    const { action = 'list', hashtag } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'list':
          return await getModerationQueue(req, res, prisma);
        case 'reports':
          return await getHashtagReports(req, res, prisma, hashtag as string);
        case 'blacklist':
          return await getBlacklistedHashtags(req, res, prisma);
        case 'stats':
          return await getModerationStats(req, res, prisma);
        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } else if (req.method === 'POST') {
      switch (action) {
        case 'moderate':
          return await moderateHashtag(req, res, prisma, userId);
        case 'report':
          return await reportHashtag(req, res, prisma, userId);
        case 'blacklist':
          return await addToBlacklist(req, res, prisma, userId);
        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } else if (req.method === 'DELETE') {
      switch (action) {
        case 'blacklist':
          return await removeFromBlacklist(req, res, prisma, userId);
        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hashtag moderation API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getModerationQueue(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  try {
    const { page = '1', limit = '20', status = 'PENDING' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const moderationItems = await prisma.hashtagModeration.findMany({
      where: { status: status as any },
      include: {
        hashtag: {
          select: {
            id: true,
            name: true,
            usageCount: true,
            followerCount: true,
            trendingScore: true,
            createdAt: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    const totalItems = await prisma.hashtagModeration.count({
      where: { status: status as any },
    });

    return res.status(200).json({
      success: true,
      data: {
        items: moderationItems,
        pagination: {
          total: totalItems,
          page: pageNum,
          limit: limitNum,
          hasMore: (pageNum * limitNum) < totalItems,
        },
      },
    });
  } catch (error) {
    console.error('Error getting moderation queue:', error);
    return res.status(500).json({ success: false, error: 'Failed to get moderation queue' });
  }
}

async function getHashtagReports(req: NextApiRequest, res: NextApiResponse, prisma: any, hashtag: string) {
  try {
    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    const reports = await prisma.hashtagReport.findMany({
      where: { hashtagId: hashtagRecord.id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        hashtag: {
          id: hashtagRecord.id,
          name: hashtagRecord.name,
        },
        reports,
      },
    });
  } catch (error) {
    console.error('Error getting hashtag reports:', error);
    return res.status(500).json({ success: false, error: 'Failed to get hashtag reports' });
  }
}

async function getBlacklistedHashtags(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const blacklistedHashtags = await prisma.hashtagBlacklist.findMany({
      include: {
        addedByUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    const totalBlacklisted = await prisma.hashtagBlacklist.count();

    return res.status(200).json({
      success: true,
      data: {
        blacklistedHashtags,
        pagination: {
          total: totalBlacklisted,
          page: pageNum,
          limit: limitNum,
          hasMore: (pageNum * limitNum) < totalBlacklisted,
        },
      },
    });
  } catch (error) {
    console.error('Error getting blacklisted hashtags:', error);
    return res.status(500).json({ success: false, error: 'Failed to get blacklisted hashtags' });
  }
}

async function getModerationStats(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  try {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      totalModerationActions,
      pendingModerationActions,
      blacklistedCount,
      recentReports,
    ] = await Promise.all([
      prisma.hashtagReport.count(),
      prisma.hashtagReport.count({ where: { status: 'PENDING' } }),
      prisma.hashtagReport.count({ where: { status: 'RESOLVED' } }),
      prisma.hashtagModeration.count(),
      prisma.hashtagModeration.count({ where: { status: 'PENDING' } }),
      prisma.hashtagBlacklist.count(),
      prisma.hashtagReport.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          hashtag: {
            select: { name: true },
          },
          reporter: {
            select: { username: true },
          },
        },
      }),
    ]);

    const stats = {
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        resolutionRate: totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0,
      },
      moderation: {
        total: totalModerationActions,
        pending: pendingModerationActions,
      },
      blacklist: {
        count: blacklistedCount,
      },
      recentActivity: recentReports,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to get moderation stats' });
  }
}

async function moderateHashtag(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { hashtagId, action, reason } = req.body;

    if (!hashtagId || !action) {
      return res.status(400).json({ success: false, error: 'Hashtag ID and action are required' });
    }

    // Verify hashtag exists
    const hashtag = await prisma.tag.findUnique({
      where: { id: hashtagId },
    });

    if (!hashtag) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    // Create moderation record
    const moderationRecord = await prisma.hashtagModeration.create({
      data: {
        hashtagId,
        moderatorId: userId,
        action: action as any,
        reason,
        status: 'APPROVED',
      },
    });

    // Apply moderation action
    switch (action) {
      case 'DELETE':
        // Delete hashtag and all related data
        await prisma.tag.delete({
          where: { id: hashtagId },
        });
        break;
      case 'SUSPEND':
        // Mark hashtag as suspended (you might want to add a status field to Tag model)
        await prisma.tag.update({
          where: { id: hashtagId },
          data: { trendingScore: 0 }, // Reset trending score
        });
        break;
      case 'WARN':
        // Just log the warning, no action needed
        break;
      case 'APPROVE':
        // Approve the hashtag (remove from moderation queue)
        break;
    }

    return res.status(200).json({
      success: true,
      data: {
        moderationRecord,
        message: `Hashtag ${action.toLowerCase()}d successfully`,
      },
    });
  } catch (error) {
    console.error('Error moderating hashtag:', error);
    return res.status(500).json({ success: false, error: 'Failed to moderate hashtag' });
  }
}

async function reportHashtag(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { hashtagId, reason, description } = req.body;

    if (!hashtagId || !reason) {
      return res.status(400).json({ success: false, error: 'Hashtag ID and reason are required' });
    }

    // Verify hashtag exists
    const hashtag = await prisma.tag.findUnique({
      where: { id: hashtagId },
    });

    if (!hashtag) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    // Check if user already reported this hashtag
    const existingReport = await prisma.hashtagReport.findUnique({
      where: {
        hashtagId_reporterId: {
          hashtagId,
          reporterId: userId,
        },
      },
    });

    if (existingReport) {
      return res.status(400).json({ success: false, error: 'You have already reported this hashtag' });
    }

    // Create report
    const report = await prisma.hashtagReport.create({
      data: {
        hashtagId,
        reporterId: userId,
        reason: reason as any,
        description,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        report,
        message: 'Hashtag reported successfully',
      },
    });
  } catch (error) {
    console.error('Error reporting hashtag:', error);
    return res.status(500).json({ success: false, error: 'Failed to report hashtag' });
  }
}

async function addToBlacklist(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { hashtagName, reason } = req.body;

    if (!hashtagName || !reason) {
      return res.status(400).json({ success: false, error: 'Hashtag name and reason are required' });
    }

    // Check if already blacklisted
    const existingBlacklist = await prisma.hashtagBlacklist.findUnique({
      where: { hashtagName: hashtagName.toLowerCase() },
    });

    if (existingBlacklist) {
      return res.status(400).json({ success: false, error: 'Hashtag is already blacklisted' });
    }

    // Add to blacklist
    const blacklistEntry = await prisma.hashtagBlacklist.create({
      data: {
        hashtagName: hashtagName.toLowerCase(),
        reason,
        addedBy: userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        blacklistEntry,
        message: `#${hashtagName} added to blacklist`,
      },
    });
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    return res.status(500).json({ success: false, error: 'Failed to add to blacklist' });
  }
}

async function removeFromBlacklist(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string) {
  try {
    const { hashtagName } = req.body;

    if (!hashtagName) {
      return res.status(400).json({ success: false, error: 'Hashtag name is required' });
    }

    // Remove from blacklist
    const deletedEntry = await prisma.hashtagBlacklist.deleteMany({
      where: { hashtagName: hashtagName.toLowerCase() },
    });

    if (deletedEntry.count === 0) {
      return res.status(404).json({ success: false, error: 'Hashtag not found in blacklist' });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: `#${hashtagName} removed from blacklist`,
      },
    });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove from blacklist' });
  }
}
