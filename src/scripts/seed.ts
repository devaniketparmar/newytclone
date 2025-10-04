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
    
    // Create sample categories
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Gaming',
          description: 'Video game content and reviews',
          iconUrl: '/icons/gaming.svg',
          sortOrder: 1
        }
      }),
      prisma.category.create({
        data: {
          name: 'Music',
          description: 'Music videos and performances',
          iconUrl: '/icons/music.svg',
          sortOrder: 2
        }
      }),
      prisma.category.create({
        data: {
          name: 'Education',
          description: 'Educational content and tutorials',
          iconUrl: '/icons/education.svg',
          sortOrder: 3
        }
      }),
      prisma.category.create({
        data: {
          name: 'Entertainment',
          description: 'Entertainment and comedy content',
          iconUrl: '/icons/entertainment.svg',
          sortOrder: 4
        }
      }),
      prisma.category.create({
        data: {
          name: 'Technology',
          description: 'Tech reviews and tutorials',
          iconUrl: '/icons/technology.svg',
          sortOrder: 5
        }
      })
    ]);
    
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
