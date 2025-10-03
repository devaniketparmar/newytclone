import { PrismaClient } from '@prisma/client';
import { initializeDatabase } from '../utils/database';

const prisma = new PrismaClient();

async function seedVideos() {
  try {
    console.log('🌱 Starting video seeding...');
    
    // Initialize database first
    await initializeDatabase();
    
    // Check if we already have videos
    const videoCount = await prisma.video.count();
    if (videoCount > 0) {
      console.log('📝 Database already has videos, skipping seeding');
      return;
    }
    
    console.log('📝 Seeding sample videos...');
    
    // Get all users to assign videos to
    const users = await prisma.user.findMany({
      include: {
        channels: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    // Sample video data
    const sampleVideos = [
      {
        title: "How to Build a YouTube Clone with Next.js",
        description: "Learn how to create a modern video sharing platform using Next.js, React, and PostgreSQL. This comprehensive tutorial covers authentication, video uploads, and real-time features.",
        thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        duration: 1847, // 30:47
        fileSize: BigInt(1048576), // 1MB
        resolution: "1280x720",
        viewCount: BigInt(15420),
        likeCount: 234,
        dislikeCount: 12,
        commentCount: 45
      },
      {
        title: "React Hooks Explained - useState and useEffect",
        description: "Deep dive into React hooks, focusing on useState and useEffect. Perfect for beginners who want to understand modern React development.",
        thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
        duration: 1245, // 20:45
        fileSize: BigInt(2097152), // 2MB
        resolution: "1280x720",
        viewCount: BigInt(8934),
        likeCount: 156,
        dislikeCount: 8,
        commentCount: 23
      },
      {
        title: "TypeScript for JavaScript Developers",
        description: "Learn TypeScript from scratch. This video covers types, interfaces, generics, and how to migrate from JavaScript to TypeScript.",
        thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        duration: 2156, // 35:56
        fileSize: BigInt(1572864), // 1.5MB
        resolution: "1280x720",
        viewCount: BigInt(12345),
        likeCount: 189,
        dislikeCount: 15,
        commentCount: 34
      },
      {
        title: "Building REST APIs with Node.js and Express",
        description: "Complete guide to building RESTful APIs using Node.js and Express. Includes authentication, validation, and error handling.",
        thumbnailUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
        duration: 1934, // 32:14
        fileSize: BigInt(2097152), // 2MB
        resolution: "1280x720",
        viewCount: BigInt(9876),
        likeCount: 167,
        dislikeCount: 9,
        commentCount: 28
      },
      {
        title: "Database Design with PostgreSQL",
        description: "Learn database design principles and best practices using PostgreSQL. Covers normalization, indexing, and query optimization.",
        thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        duration: 1678, // 27:58
        fileSize: BigInt(1048576), // 1MB
        resolution: "1280x720",
        viewCount: BigInt(7654),
        likeCount: 134,
        dislikeCount: 6,
        commentCount: 19
      },
      {
        title: "CSS Grid and Flexbox Layout Masterclass",
        description: "Master modern CSS layout techniques with Grid and Flexbox. Learn when to use each and how to combine them effectively.",
        thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
        duration: 1456, // 24:16
        fileSize: BigInt(1572864), // 1.5MB
        resolution: "1280x720",
        viewCount: BigInt(11234),
        likeCount: 198,
        dislikeCount: 11,
        commentCount: 42
      },
      {
        title: "Git and GitHub for Beginners",
        description: "Complete Git and GitHub tutorial for beginners. Learn version control, branching, merging, and collaboration workflows.",
        thumbnailUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        duration: 1789, // 29:49
        fileSize: BigInt(1048576), // 1MB
        resolution: "1280x720",
        viewCount: BigInt(8765),
        likeCount: 145,
        dislikeCount: 7,
        commentCount: 31
      },
      {
        title: "Docker Containerization Guide",
        description: "Learn Docker from basics to advanced concepts. Containerize applications, use Docker Compose, and deploy to production.",
        thumbnailUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335a?w=320&h=180&fit=crop",
        videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
        duration: 2034, // 33:54
        fileSize: BigInt(2097152), // 2MB
        resolution: "1280x720",
        viewCount: BigInt(6543),
        likeCount: 123,
        dislikeCount: 5,
        commentCount: 17
      }
    ];

    // Create videos for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userChannel = user.channels[0]; // Get first channel
      
      if (!userChannel) {
        console.log(`⚠️ User ${user.username} has no channel, skipping...`);
        continue;
      }

      // Assign 2-3 videos per user
      const videosPerUser = Math.floor(Math.random() * 2) + 2; // 2-3 videos
      const startIndex = (i * videosPerUser) % sampleVideos.length;
      
      for (let j = 0; j < videosPerUser; j++) {
        const videoIndex = (startIndex + j) % sampleVideos.length;
        const videoData = sampleVideos[videoIndex];
        
        // Add some randomness to make videos unique
        const randomViews = Math.floor(Math.random() * 10000) + 1000;
        const randomLikes = Math.floor(Math.random() * 200) + 50;
        const randomComments = Math.floor(Math.random() * 50) + 10;
        
        await prisma.video.create({
          data: {
            channelId: userChannel.id,
            title: videoData.title,
            description: videoData.description,
            thumbnailUrl: videoData.thumbnailUrl,
            videoUrl: videoData.videoUrl,
            duration: videoData.duration,
            fileSize: videoData.fileSize,
            resolution: videoData.resolution,
            privacy: 'PUBLIC',
            status: 'READY',
            viewCount: BigInt(randomViews),
            likeCount: randomLikes,
            dislikeCount: Math.floor(Math.random() * 20),
            commentCount: randomComments,
            publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            metadata: {
              originalFileName: `video_${i}_${j}.mp4`,
              uploadDate: new Date().toISOString(),
              fileType: 'video/mp4'
            },
            processingStatus: {
              status: 'completed',
              progress: 100,
              completedAt: new Date().toISOString()
            }
          }
        });
      }
    }
    
    console.log('✅ Video seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Video seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedVideos()
    .then(() => {
      console.log('✅ Video seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Video seeding failed:', error);
      process.exit(1);
    });
}

export default seedVideos;
