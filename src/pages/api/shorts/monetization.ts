import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token provided' });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Get user's channel
    const channel = await prisma.channel.findFirst({
      where: { userId: decoded.userId as string },
      include: {
        videos: {
          where: { videoType: 'SHORTS' },
          include: {
            _count: {
              select: {
                likes: true,
                comments: true,
                views: true
              }
            }
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    // Calculate performance metrics
    const totalViews = channel.videos.reduce((sum, video) => sum + Number(video.viewCount), 0);
    const totalLikes = channel.videos.reduce((sum, video) => sum + video._count.likes, 0);
    const totalComments = channel.videos.reduce((sum, video) => sum + video._count.comments, 0);
    const totalShorts = channel.videos.length;
    const averageViewsPerShort = totalShorts > 0 ? totalViews / totalShorts : 0;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    // Check monetization eligibility
    const requirements = [
      {
        requirement: '1,000 subscribers',
        status: channel.subscriberCount >= 1000 ? 'met' : 'not_met',
        currentValue: channel.subscriberCount,
        requiredValue: 1000
      },
      {
        requirement: '10M Shorts views in the last 90 days',
        status: totalViews >= 10000000 ? 'met' : 'not_met',
        currentValue: totalViews,
        requiredValue: 10000000
      },
      {
        requirement: 'Follow Community Guidelines',
        status: 'met', // Assume met for demo
        currentValue: undefined,
        requiredValue: undefined
      },
      {
        requirement: 'Have an AdSense account',
        status: 'not_met', // Assume not met for demo
        currentValue: undefined,
        requiredValue: undefined
      }
    ];

    const isEligible = requirements.every(req => req.status === 'met');

    // Calculate revenue (mock data for demo)
    const baseRevenue = totalViews * 0.001; // $0.001 per view
    const totalEarnings = baseRevenue;
    const monthlyEarnings = baseRevenue * 0.3; // 30% of total
    const shortsFundEarnings = totalViews > 1000000 ? baseRevenue * 0.1 : 0; // 10% bonus for high views
    const adRevenue = totalEarnings - shortsFundEarnings;
    const estimatedMonthlyEarnings = monthlyEarnings;

    // Shorts Fund data
    const shortsFund = {
      isEligible: totalViews >= 1000000,
      monthlyPool: 100000000, // $100M monthly pool
      estimatedShare: shortsFundEarnings,
      lastPayment: '2024-01-15',
      nextPayment: '2024-02-15'
    };

    // Tips for monetization
    const tips = [
      {
        title: 'Create Engaging Content',
        description: 'Focus on the first 3 seconds to hook viewers and keep them watching until the end.',
        category: 'content' as const
      },
      {
        title: 'Use Trending Hashtags',
        description: 'Research and use popular hashtags to increase discoverability and reach.',
        category: 'content' as const
      },
      {
        title: 'Post Consistently',
        description: 'Upload Shorts regularly to maintain audience engagement and algorithm favor.',
        category: 'growth' as const
      },
      {
        title: 'Engage with Comments',
        description: 'Reply to comments quickly to boost engagement and build community.',
        category: 'engagement' as const
      },
      {
        title: 'Cross-Promote',
        description: 'Share your Shorts on other social media platforms to drive traffic.',
        category: 'growth' as const
      },
      {
        title: 'Analyze Performance',
        description: 'Use analytics to understand what content performs best and create more of it.',
        category: 'monetization' as const
      },
      {
        title: 'Collaborate with Others',
        description: 'Partner with other creators to reach new audiences and grow together.',
        category: 'growth' as const
      },
      {
        title: 'Optimize for Mobile',
        description: 'Ensure your Shorts look great on mobile devices since most viewers are on phones.',
        category: 'content' as const
      }
    ];

    const monetizationData = {
      eligibility: {
        isEligible,
        requirements
      },
      revenue: {
        totalEarnings,
        monthlyEarnings,
        shortsFundEarnings,
        adRevenue,
        estimatedMonthlyEarnings
      },
      performance: {
        totalViews,
        totalShorts,
        averageViewsPerShort,
        engagementRate,
        subscriberGrowth: channel.subscriberCount // Mock growth
      },
      shortsFund,
      tips
    };

    return res.status(200).json({
      success: true,
      data: monetizationData
    });

  } catch (error) {
    console.error('Error fetching Shorts monetization data:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
