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

    const userId = (decoded as any).userId;
    const { hashtag } = req.query;

    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    // Find the hashtag by name
    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag as string },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    switch (req.method) {
      case 'POST':
        // Follow hashtag
        return await followHashtag(req, res, prisma, userId, hashtagRecord.id as string);
      
      case 'DELETE':
        // Unfollow hashtag
        return await unfollowHashtag(req, res, prisma, userId, hashtagRecord.id as string);
      
      case 'GET':
        // Check follow status
        return await getFollowStatus(req, res, prisma, userId, hashtagRecord.id as string);
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hashtag follow API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function followHashtag(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string, hashtagId: string) {
  try {
    // Check if already following
    const existingFollow = await prisma.hashtagFollow.findUnique({
      where: {
        userId_hashtagId: {
          userId,
          hashtagId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ success: false, error: 'Already following this hashtag' });
    }

    // Create follow relationship
    const follow = await prisma.hashtagFollow.create({
      data: {
        userId,
        hashtagId,
      },
    });

    // Update follower count
    await prisma.tag.update({
      where: { id: hashtagId },
      data: { followerCount: { increment: 1 } },
    });

    // Create notification for hashtag followers (optional)
    await createHashtagNotification(prisma, userId, hashtagId, 'followed');

    return res.status(201).json({
      success: true,
      data: {
        follow,
        message: 'Successfully followed hashtag',
      },
    });
  } catch (error) {
    console.error('Error following hashtag:', error);
    return res.status(500).json({ success: false, error: 'Failed to follow hashtag' });
  }
}

async function unfollowHashtag(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string, hashtagId: string) {
  try {
    // Check if following
    const existingFollow = await prisma.hashtagFollow.findUnique({
      where: {
        userId_hashtagId: {
          userId,
          hashtagId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(400).json({ success: false, error: 'Not following this hashtag' });
    }

    // Delete follow relationship
    await prisma.hashtagFollow.delete({
      where: {
        userId_hashtagId: {
          userId,
          hashtagId,
        },
      },
    });

    // Update follower count
    await prisma.tag.update({
      where: { id: hashtagId },
      data: { followerCount: { decrement: 1 } },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Successfully unfollowed hashtag',
      },
    });
  } catch (error) {
    console.error('Error unfollowing hashtag:', error);
    return res.status(500).json({ success: false, error: 'Failed to unfollow hashtag' });
  }
}

async function getFollowStatus(req: NextApiRequest, res: NextApiResponse, prisma: any, userId: string, hashtagId: string) {
  try {
    const follow = await prisma.hashtagFollow.findUnique({
      where: {
        userId_hashtagId: {
          userId,
          hashtagId,
        },
      },
    });

    const hashtag = await prisma.tag.findUnique({
      where: { id: hashtagId },
      select: {
        id: true,
        name: true,
        followerCount: true,
        usageCount: true,
        trendingScore: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        isFollowing: !!follow,
        hashtag,
        follow,
      },
    });
  } catch (error) {
    console.error('Error getting follow status:', error);
    return res.status(500).json({ success: false, error: 'Failed to get follow status' });
  }
}

async function createHashtagNotification(prisma: any, userId: string, hashtagId: string, action: string) {
  try {
    const hashtag = await prisma.tag.findUnique({
      where: { id: hashtagId },
      select: { name: true },
    });

    if (!hashtag) return;

    await prisma.notification.create({
      data: {
        userId,
        type: 'HASHTAG_NEW_VIDEO',
        title: `Hashtag Activity`,
        message: `You ${action} the hashtag #${hashtag.name}`,
        data: {
          hashtagId,
          hashtagName: hashtag.name,
          action,
        },
      },
    });
  } catch (error) {
    console.error('Error creating hashtag notification:', error);
  }
}
