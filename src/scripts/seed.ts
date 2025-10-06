import { PrismaClient } from '@prisma/client';
import { initializeDatabase } from '../utils/database';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database first
    await initializeDatabase();
    
    // Check if we already have data
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('📝 Database already has data, skipping seeding');
      return;
    }
    
    console.log('📝 Seeding initial data...');
    
    // Create sample categories (upsert to handle existing data)
    const categoryData = [
      { name: 'Music', description: 'Music videos and performances', iconUrl: '/icons/music.svg', sortOrder: 1 },
      { name: 'Gaming', description: 'Video game content and reviews', iconUrl: '/icons/gaming.svg', sortOrder: 2 },
      { name: 'News', description: 'News and current events', iconUrl: '/icons/news.svg', sortOrder: 3 },
      { name: 'Sports', description: 'Sports content and highlights', iconUrl: '/icons/sports.svg', sortOrder: 4 },
      { name: 'Education', description: 'Educational content and tutorials', iconUrl: '/icons/education.svg', sortOrder: 5 },
      { name: 'Entertainment', description: 'Entertainment and comedy content', iconUrl: '/icons/entertainment.svg', sortOrder: 6 },
      { name: 'Technology', description: 'Tech reviews and tutorials', iconUrl: '/icons/technology.svg', sortOrder: 7 },
      { name: 'Cooking', description: 'Cooking and food content', iconUrl: '/icons/cooking.svg', sortOrder: 8 },
      { name: 'Travel', description: 'Travel and adventure content', iconUrl: '/icons/travel.svg', sortOrder: 9 },
      { name: 'Fitness', description: 'Fitness and workout content', iconUrl: '/icons/fitness.svg', sortOrder: 10 },
      { name: 'Comedy', description: 'Comedy and humor content', iconUrl: '/icons/comedy.svg', sortOrder: 11 },
      { name: 'Art', description: 'Art and creative content', iconUrl: '/icons/art.svg', sortOrder: 12 },
      { name: 'Science', description: 'Science and research content', iconUrl: '/icons/science.svg', sortOrder: 13 },
      { name: 'Business', description: 'Business and finance content', iconUrl: '/icons/business.svg', sortOrder: 14 }
    ];

    const categories = await Promise.all(
      categoryData.map(cat => 
        prisma.category.upsert({
          where: { name: cat.name },
          update: cat,
          create: cat
        })
      )
    );
    
    console.log(`✅ Created ${categories.length} categories`);
    
    // Create sample tags
    const tags = await Promise.all([
      prisma.tag.create({
        data: {
          name: 'tutorial',
          usageCount: 0
        }
      }),
      prisma.tag.create({
        data: {
          name: 'review',
          usageCount: 0
        }
      }),
      prisma.tag.create({
        data: {
          name: 'gaming',
          usageCount: 0
        }
      }),
      prisma.tag.create({
        data: {
          name: 'music',
          usageCount: 0
        }
      }),
      prisma.tag.create({
        data: {
          name: 'tech',
          usageCount: 0
        }
      })
    ]);
    
    console.log(`✅ Created ${tags.length} tags`);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seed;
