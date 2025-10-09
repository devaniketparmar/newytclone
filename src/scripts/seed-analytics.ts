import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnalyticsData() {
  console.log('🌱 Starting analytics data seeding...');

  try {
    // Get all channels
    const channels = await prisma.channel.findMany({
      include: {
        videos: true,
        user: true
      }
    });

    if (channels.length === 0) {
      console.log('❌ No channels found. Please seed users and channels first.');
      return;
    }

    console.log(`📊 Found ${channels.length} channels to seed analytics for`);

    for (const channel of channels) {
      console.log(`📈 Seeding analytics for channel: ${channel.name}`);

      // Generate analytics data for the last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      // Generate daily analytics data
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        
        // Skip weekends for more realistic data
        if (date.getDay() === 0 || date.getDay() === 6) {
          continue;
        }

        // Generate random but realistic analytics data
        const baseViews = Math.floor(Math.random() * 100) + 10;
        const baseSubscribers = Math.floor(Math.random() * 5) + 1;
        const baseWatchTime = Math.floor(Math.random() * 3600) + 300; // 5 minutes to 1 hour

        // Create channel analytics
        await prisma.channelAnalytics.upsert({
          where: {
            channelId_date: {
              channelId: channel.id,
              date: date
            }
          },
          update: {},
          create: {
            channelId: channel.id,
            date: date,
            views: baseViews,
            uniqueViewers: Math.floor(baseViews * 0.8),
            watchTime: baseWatchTime,
            subscribersGained: baseSubscribers,
            subscribersLost: Math.floor(Math.random() * 2),
            videosPublished: Math.random() > 0.9 ? 1 : 0 // 10% chance of publishing a video
          }
        });

        // Create video analytics for each video
        for (const video of channel.videos) {
          const videoViews = Math.floor(Math.random() * 50) + 5;
          const videoLikes = Math.floor(videoViews * (Math.random() * 0.1 + 0.05)); // 5-15% like rate
          const videoComments = Math.floor(videoViews * (Math.random() * 0.02 + 0.01)); // 1-3% comment rate
          const videoShares = Math.floor(videoViews * (Math.random() * 0.01 + 0.005)); // 0.5-1.5% share rate

          await prisma.videoAnalytics.upsert({
            where: {
              videoId_date: {
                videoId: video.id,
                date: date
              }
            },
            update: {},
            create: {
              videoId: video.id,
              date: date,
              views: videoViews,
              uniqueViewers: Math.floor(videoViews * 0.85),
              watchTime: Math.floor(videoViews * (Math.random() * 60 + 30)), // 30-90 seconds per view
              likes: videoLikes,
              dislikes: Math.floor(videoLikes * 0.1), // 10% dislike rate
              comments: videoComments,
              shares: videoShares,
              subscribersGained: Math.floor(Math.random() * 3),
              subscribersLost: Math.floor(Math.random() * 1)
            }
          });
        }
      }

      console.log(`✅ Completed analytics seeding for channel: ${channel.name}`);
    }

    // Update channel statistics based on analytics
    for (const channel of channels) {
      const totalViews = await prisma.channelAnalytics.aggregate({
        where: { channelId: channel.id },
        _sum: { views: true }
      });

      const totalSubscribers = await prisma.subscription.count({
        where: { channelId: channel.id }
      });

      const totalVideos = await prisma.video.count({
        where: { channelId: channel.id }
      });

      // Update channel with aggregated data
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          viewCount: totalViews._sum.views || 0,
          subscriberCount: totalSubscribers,
          videoCount: totalVideos
        }
      });

      console.log(`📊 Updated channel stats for: ${channel.name}`);
    }

    console.log('🎉 Analytics data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedAnalyticsData();
