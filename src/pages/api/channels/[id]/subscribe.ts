import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Channel ID is required'
    });
  }

  if (req.method === 'POST') {
    return handleSubscribe(req, res, id);
  }

  if (req.method === 'DELETE') {
    return handleUnsubscribe(req, res, id);
  }

  if (req.method === 'GET') {
    return handleGetSubscriptionStatus(req, res, id);
  }

  res.setHeader('Allow', ['POST', 'DELETE', 'GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleSubscribe(req: NextApiRequest, res: NextApiResponse, channelId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { 
        id: true, 
        name: true, 
        subscriberCount: true,
        userId: true 
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user is trying to subscribe to their own channel
    if (channel.userId === decoded.userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot subscribe to your own channel'
      });
    }

    // Check if user is already subscribed
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.userId,
        channelId
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'You are already subscribed to this channel'
      });
    }

    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: decoded.userId,
        channelId
      }
    });

    // Update channel subscriber count
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        subscriberCount: {
          increment: 1
        }
      }
    });

    // Create notification for channel owner
    await prisma.notification.create({
      data: {
        userId: channel.userId,
        type: 'NEW_SUBSCRIPTION',
        title: 'New Subscriber',
        message: `You have a new subscriber!`,
        data: {
          subscriberId: decoded.userId,
          channelId
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        subscribed: true,
        subscriberCount: channel.subscriberCount + 1
      }
    });

  } catch (error) {
    console.error('Error subscribing to channel:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleUnsubscribe(req: NextApiRequest, res: NextApiResponse, channelId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { 
        id: true, 
        name: true, 
        subscriberCount: true 
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user is subscribed
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.userId,
        channelId
      }
    });

    if (!existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'You are not subscribed to this channel'
      });
    }

    // Delete subscription
    await prisma.subscription.delete({
      where: { id: existingSubscription.id }
    });

    // Update channel subscriber count
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        subscriberCount: {
          decrement: 1
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        subscribed: false,
        subscriberCount: Math.max(0, channel.subscriberCount - 1)
      }
    });

  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleGetSubscriptionStatus(req: NextApiRequest, res: NextApiResponse, channelId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies (optional)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    let userId = null;
    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch (error) {
        console.log('Token verification failed, proceeding without authentication');
      }
    }

    // Get channel with current subscriber count
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { 
        id: true, 
        name: true, 
        subscriberCount: true 
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    let isSubscribed = false;

    // Get user's subscription status if authenticated
    if (userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          channelId
        }
      });

      isSubscribed = !!subscription;
    }

    return res.status(200).json({
      success: true,
      data: {
        subscribed: isSubscribed,
        subscriberCount: channel.subscriberCount
      }
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
