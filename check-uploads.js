const { PrismaClient } = require('@prisma/client');

async function checkRecentUploads() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking recent video uploads...');
    
    const recentVideos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        createdAt: true
      }
    });
    
    console.log('Recent videos:');
    recentVideos.forEach(video => {
      console.log(`- ${video.title}: ${video.thumbnailUrl} (${video.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentUploads();
