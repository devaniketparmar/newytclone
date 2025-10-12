import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignCategories() {
  try {
    console.log('Starting category assignment...');

    // First, let's check what categories exist
    const existingCategories = await prisma.category.findMany();
    console.log('Existing categories:', existingCategories.map(c => c.name));

    // If no categories exist, create some
    if (existingCategories.length === 0) {
      console.log('Creating categories...');
      await prisma.category.createMany({
        data: [
          { name: 'Gaming', description: 'Gaming content', active: true },
          { name: 'Music', description: 'Music videos', active: true },
          { name: 'Education', description: 'Educational content', active: true },
          { name: 'Technology', description: 'Technology videos', active: true },
          { name: 'Entertainment', description: 'Entertainment content', active: true },
          { name: 'Sports', description: 'Sports content', active: true },
          { name: 'News', description: 'News content', active: true },
          { name: 'Comedy', description: 'Comedy videos', active: true },
          { name: 'Science', description: 'Science content', active: true },
          { name: 'Travel', description: 'Travel videos', active: true },
          { name: 'Food', description: 'Food content', active: true }
        ]
      });
      console.log('Categories created successfully');
    }

    // Get all videos without categories
    const videosWithoutCategories = await prisma.video.findMany({
      where: {
        categoryId: null
      },
      take: 20 // Limit to first 20 videos
    });

    console.log(`Found ${videosWithoutCategories.length} videos without categories`);

    // Get categories again
    const categories = await prisma.category.findMany();
    
    // Assign random categories to videos
    for (const video of videosWithoutCategories) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      await prisma.video.update({
        where: { id: video.id },
        data: { categoryId: randomCategory.id }
      });
      
      console.log(`Assigned category "${randomCategory.name}" to video "${video.title}"`);
    }

    console.log('Category assignment completed successfully!');
  } catch (error) {
    console.error('Error assigning categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCategories();
