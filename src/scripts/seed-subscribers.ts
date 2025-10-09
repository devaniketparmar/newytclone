import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscribers() {
  console.log('🌱 Starting subscriber data seeding...');

  try {
    // Get all channels
    const channels = await prisma.channel.findMany({
      include: {
        user: true
      }
    });

    if (channels.length === 0) {
      console.log('❌ No channels found. Please create channels first.');
      return;
    }

    console.log(`📺 Found ${channels.length} channels`);

    // Get all users (potential subscribers)
    const users = await prisma.user.findMany();
    console.log(`👥 Found ${users.length} users`);

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create subscriptions');
      return;
    }

    // Create subscriptions for each channel
    for (const channel of channels) {
      console.log(`📊 Creating subscriptions for channel: ${channel.name}`);

      // Get a random subset of users to subscribe to this channel
      const availableUsers = users.filter(user => user.id !== channel.userId); // Don't subscribe to own channel
      const subscriberCount = Math.floor(Math.random() * availableUsers.length) + 1; // 1 to all available users
      const shuffledUsers = availableUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, subscriberCount);

      console.log(`   Creating ${subscriberCount} subscriptions...`);

      if (subscriberCount === 0) {
        console.log(`   ⚠️ No available users to subscribe to channel: ${channel.name}`);
        continue;
      }

      // Create subscriptions with random dates over the last 90 days
      const subscriptions = [];
      for (let i = 0; i < subscriberCount; i++) {
        const user = shuffledUsers[i];
        const daysAgo = Math.floor(Math.random() * 90); // Random day in last 90 days
        const subscribedAt = new Date();
        subscribedAt.setDate(subscribedAt.getDate() - daysAgo);

        subscriptions.push({
          userId: user.id,
          channelId: channel.id,
          createdAt: subscribedAt
        });
      }

      // Batch insert subscriptions
      await prisma.subscription.createMany({
        data: subscriptions,
        skipDuplicates: true
      });

      console.log(`   ✅ Created ${subscriptions.length} subscriptions`);
    }

    // Create some additional subscription activity (views, likes, comments from subscribers)
    console.log('🎬 Creating subscriber activity...');
    
    for (const channel of channels) {
      // Get subscribers for this channel
      const subscribers = await prisma.subscription.findMany({
        where: { channelId: channel.id },
        include: { user: true }
      });

      // Get videos for this channel
      const videos = await prisma.video.findMany({
        where: { channelId: channel.id }
      });

      if (subscribers.length === 0 || videos.length === 0) continue;

      console.log(`   Creating activity for ${subscribers.length} subscribers and ${videos.length} videos`);

      // Create views from subscribers
      for (const video of videos) {
        const viewCount = Math.floor(Math.random() * subscribers.length * 0.8); // 80% of subscribers might view
        const viewers = subscribers
          .sort(() => 0.5 - Math.random())
          .slice(0, viewCount);

        for (const subscriber of viewers) {
          const daysAgo = Math.floor(Math.random() * 30); // Random day in last 30 days
          const viewedAt = new Date();
          viewedAt.setDate(viewedAt.getDate() - daysAgo);

          await prisma.view.create({
            data: {
              userId: subscriber.userId,
              videoId: video.id,
              watchDuration: Math.floor(Math.random() * video.duration || 300), // Random watch duration
              completionPercentage: Math.floor(Math.random() * 100),
              createdAt: viewedAt,
              updatedAt: viewedAt
            }
          });
        }
      }

      // Create likes from subscribers
      for (const video of videos) {
        const likeCount = Math.floor(Math.random() * subscribers.length * 0.3); // 30% might like
        const likers = subscribers
          .sort(() => 0.5 - Math.random())
          .slice(0, likeCount);

        for (const subscriber of likers) {
          const daysAgo = Math.floor(Math.random() * 30);
          const likedAt = new Date();
          likedAt.setDate(likedAt.getDate() - daysAgo);

          await prisma.like.create({
            data: {
              userId: subscriber.userId,
              videoId: video.id,
              type: 'LIKE',
              createdAt: likedAt,
              updatedAt: likedAt
            }
          });
        }
      }

      // Create comments from subscribers
      for (const video of videos) {
        const commentCount = Math.floor(Math.random() * subscribers.length * 0.1); // 10% might comment
        const commenters = subscribers
          .sort(() => 0.5 - Math.random())
          .slice(0, commentCount);

        for (const subscriber of commenters) {
          const daysAgo = Math.floor(Math.random() * 30);
          const commentedAt = new Date();
          commentedAt.setDate(commentedAt.getDate() - daysAgo);

          await prisma.comment.create({
            data: {
              userId: subscriber.userId,
              videoId: video.id,
              content: `Great video! Keep up the good work! 👍`,
              createdAt: commentedAt,
              updatedAt: commentedAt
            }
          });
        }
      }

      console.log(`   ✅ Created subscriber activity for channel: ${channel.name}`);
    }

    // Get final statistics
    const totalSubscriptions = await prisma.subscription.count();
    const totalViews = await prisma.view.count();
    const totalLikes = await prisma.like.count();
    const totalComments = await prisma.comment.count();

    console.log('\n📊 Subscriber Data Summary:');
    console.log(`   Total Subscriptions: ${totalSubscriptions}`);
    console.log(`   Total Views from Subscribers: ${totalViews}`);
    console.log(`   Total Likes from Subscribers: ${totalLikes}`);
    console.log(`   Total Comments from Subscribers: ${totalComments}`);

    console.log('\n✅ Subscriber data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding subscriber data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSubscribers()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
