import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedComprehensiveAnalytics() {
  console.log('🌱 Starting comprehensive analytics seeding...');

  try {
    // Get all channels and videos
    const channels = await prisma.channel.findMany({
      include: {
        videos: true
      }
    });

    console.log(`Found ${channels.length} channels to seed analytics for`);

    for (const channel of channels) {
      console.log(`Seeding analytics for channel: ${channel.name}`);

      // Generate analytics for the last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      // Channel analytics
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);

        // Check if analytics already exist for this date
        const existingAnalytics = await prisma.channelAnalytics.findUnique({
          where: {
            channelId_date: {
              channelId: channel.id,
              date: date
            }
          }
        });

        if (!existingAnalytics) {
          // Generate realistic analytics data
          const views = Math.floor(Math.random() * 1000) + 100;
          const uniqueViewers = Math.floor(views * (0.7 + Math.random() * 0.2));
          const watchTime = Math.floor(views * (120 + Math.random() * 180)); // 2-5 minutes average
          const subscribersGained = Math.floor(Math.random() * 20);
          const subscribersLost = Math.floor(Math.random() * 5);
          const videosPublished = Math.random() < 0.1 ? 1 : 0; // 10% chance of publishing a video
          const totalLikes = Math.floor(views * (0.05 + Math.random() * 0.1));
          const totalComments = Math.floor(views * (0.01 + Math.random() * 0.03));
          const totalShares = Math.floor(views * (0.005 + Math.random() * 0.015));
          const avgWatchTime = Math.floor(watchTime / views);
          const engagementRate = ((totalLikes + totalComments + totalShares) / views) * 100;
          const revenue = Math.floor(views * (0.01 + Math.random() * 0.05)); // $0.01-0.05 per view

          // Generate traffic source data
          const trafficSource = {
            direct: Math.floor(views * (0.3 + Math.random() * 0.2)),
            search: Math.floor(views * (0.2 + Math.random() * 0.3)),
            social: Math.floor(views * (0.1 + Math.random() * 0.2)),
            external: Math.floor(views * (0.05 + Math.random() * 0.15))
          };

          // Generate device type data
          const deviceType = {
            desktop: Math.floor(views * (0.3 + Math.random() * 0.2)),
            mobile: Math.floor(views * (0.4 + Math.random() * 0.3)),
            tablet: Math.floor(views * (0.05 + Math.random() * 0.1))
          };

          // Generate country data
          const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];
          const country = countries.reduce((acc, country) => {
            acc[country] = Math.floor(views * (0.05 + Math.random() * 0.15));
            return acc;
          }, {} as Record<string, number>);

          // Generate age group data
          const ageGroup = {
            '18-24': Math.floor(views * (0.1 + Math.random() * 0.2)),
            '25-34': Math.floor(views * (0.2 + Math.random() * 0.3)),
            '35-44': Math.floor(views * (0.15 + Math.random() * 0.25)),
            '45-54': Math.floor(views * (0.1 + Math.random() * 0.2)),
            '55+': Math.floor(views * (0.05 + Math.random() * 0.15))
          };

          // Generate gender data
          const gender = {
            male: Math.floor(views * (0.4 + Math.random() * 0.2)),
            female: Math.floor(views * (0.3 + Math.random() * 0.2)),
            other: Math.floor(views * (0.02 + Math.random() * 0.08))
          };

          await prisma.channelAnalytics.create({
            data: {
              channelId: channel.id,
              date: date,
              views,
              uniqueViewers,
              watchTime,
              subscribersGained,
              subscribersLost,
              videosPublished,
              totalLikes,
              totalComments,
              totalShares,
              avgWatchTime,
              engagementRate,
              revenue,
              trafficSource,
              deviceType,
              country,
              ageGroup,
              gender
            }
          });
        }
      }

      // Video analytics for each video
      for (const video of channel.videos) {
        console.log(`Seeding analytics for video: ${video.title}`);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);

          // Only generate analytics for videos published before or on this date
          if (video.publishedAt && video.publishedAt > date) {
            continue;
          }

          // Check if analytics already exist for this date
          const existingVideoAnalytics = await prisma.videoAnalytics.findUnique({
            where: {
              videoId_date: {
                videoId: video.id,
                date: date
              }
            }
          });

          if (!existingVideoAnalytics) {
            // Generate realistic video analytics data
            const views = Math.floor(Math.random() * 500) + 50;
            const uniqueViewers = Math.floor(views * (0.7 + Math.random() * 0.2));
            const watchTime = Math.floor(views * (video.duration * 0.3 + Math.random() * video.duration * 0.4));
            const likes = Math.floor(views * (0.05 + Math.random() * 0.1));
            const dislikes = Math.floor(views * (0.001 + Math.random() * 0.005));
            const comments = Math.floor(views * (0.01 + Math.random() * 0.03));
            const shares = Math.floor(views * (0.005 + Math.random() * 0.015));
            const subscribersGained = Math.floor(Math.random() * 10);
            const subscribersLost = Math.floor(Math.random() * 2);
            const avgWatchDuration = Math.floor(watchTime / views);
            const completionRate = (avgWatchDuration / video.duration) * 100;
            const engagementRate = ((likes + comments + shares) / views) * 100;

            // Generate traffic source data
            const trafficSource = {
              direct: Math.floor(views * (0.3 + Math.random() * 0.2)),
              search: Math.floor(views * (0.2 + Math.random() * 0.3)),
              social: Math.floor(views * (0.1 + Math.random() * 0.2)),
              external: Math.floor(views * (0.05 + Math.random() * 0.15))
            };

            // Generate device type data
            const deviceType = {
              desktop: Math.floor(views * (0.3 + Math.random() * 0.2)),
              mobile: Math.floor(views * (0.4 + Math.random() * 0.3)),
              tablet: Math.floor(views * (0.05 + Math.random() * 0.1))
            };

            // Generate country data
            const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];
            const country = countries.reduce((acc, country) => {
              acc[country] = Math.floor(views * (0.05 + Math.random() * 0.15));
              return acc;
            }, {} as Record<string, number>);

            // Generate age group data
            const ageGroup = {
              '18-24': Math.floor(views * (0.1 + Math.random() * 0.2)),
              '25-34': Math.floor(views * (0.2 + Math.random() * 0.3)),
              '35-44': Math.floor(views * (0.15 + Math.random() * 0.25)),
              '45-54': Math.floor(views * (0.1 + Math.random() * 0.2)),
              '55+': Math.floor(views * (0.05 + Math.random() * 0.15))
            };

            // Generate gender data
            const gender = {
              male: Math.floor(views * (0.4 + Math.random() * 0.2)),
              female: Math.floor(views * (0.3 + Math.random() * 0.2)),
              other: Math.floor(views * (0.02 + Math.random() * 0.08))
            };

            await prisma.videoAnalytics.create({
              data: {
                videoId: video.id,
                date: date,
                views,
                uniqueViewers,
                watchTime,
                likes,
                dislikes,
                comments,
                shares,
                subscribersGained,
                subscribersLost,
                avgWatchDuration,
                completionRate,
                engagementRate,
                trafficSource,
                deviceType,
                country,
                ageGroup,
                gender
              }
            });
          }
        }
      }

      // Generate watch time analytics for some videos
      for (const video of channel.videos.slice(0, 5)) { // Only for first 5 videos to avoid too much data
        const watchTimeRecords = Math.floor(Math.random() * 100) + 50;
        
        for (let i = 0; i < watchTimeRecords; i++) {
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
          createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

          const watchDuration = Math.floor(Math.random() * video.duration);
          const totalDuration = video.duration;
          const completionRate = (watchDuration / totalDuration) * 100;
          const pauseCount = Math.floor(Math.random() * 5);
          const seekCount = Math.floor(Math.random() * 3);

          const deviceTypes = ['desktop', 'mobile', 'tablet'];
          const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
          const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];

          await prisma.watchTimeAnalytics.create({
            data: {
              videoId: video.id,
              userId: Math.random() < 0.7 ? channel.userId : null, // 70% chance of being a registered user
              sessionId: `session_${Date.now()}_${i}`,
              watchDuration,
              totalDuration,
              completionRate,
              pauseCount,
              seekCount,
              deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
              browser: browsers[Math.floor(Math.random() * browsers.length)],
              country: countries[Math.floor(Math.random() * countries.length)],
              createdAt
            }
          });
        }
      }

      // Generate some analytics insights
      const insights = [
        {
          type: 'PERFORMANCE_ALERT',
          priority: 'HIGH',
          title: 'Strong Performance Detected',
          description: 'Your channel has shown excellent performance metrics this period.',
          data: { period: '28d', growth: '15%' }
        },
        {
          type: 'GROWTH_OPPORTUNITY',
          priority: 'MEDIUM',
          title: 'Subscriber Growth Opportunity',
          description: 'Consider creating more content to maintain subscriber growth momentum.',
          data: { subscribers: 'growing', rate: '8%' }
        },
        {
          type: 'ENGAGEMENT_INSIGHT',
          priority: 'MEDIUM',
          title: 'High Engagement Rate',
          description: 'Your audience engagement is above average. Keep up the great work!',
          data: { engagementRate: '6.2%', benchmark: '4.1%' }
        }
      ];

      for (const insight of insights) {
        await prisma.analyticsInsight.create({
          data: {
            channelId: channel.id,
            type: insight.type as any,
            title: insight.title,
            description: insight.description,
            priority: insight.priority as any,
            data: insight.data,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
          }
        });
      }
    }

    console.log('✅ Comprehensive analytics seeding completed successfully!');
    console.log(`📊 Generated analytics data for ${channels.length} channels`);
    console.log(`📈 Created insights and recommendations`);
    console.log(`⏱️  Generated watch time analytics`);

  } catch (error) {
    console.error('❌ Error seeding comprehensive analytics:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedComprehensiveAnalytics()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedComprehensiveAnalytics;
