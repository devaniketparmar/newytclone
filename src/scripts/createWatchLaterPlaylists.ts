import { getInitializedPrisma } from '../lib/prisma';

async function createWatchLaterPlaylistsForExistingUsers() {
  try {
    console.log('Starting migration: Creating Watch Later playlists for existing users...');
    
    const prisma = await getInitializedPrisma();
    
    // Get all users who don't have a "Watch Later" playlist
    const usersWithoutWatchLater = await prisma.user.findMany({
      where: {
        playlists: {
          none: {
            name: 'Watch Later'
          }
        }
      },
      select: {
        id: true,
        username: true
      }
    });

    console.log(`Found ${usersWithoutWatchLater.length} users without Watch Later playlists`);

    if (usersWithoutWatchLater.length === 0) {
      console.log('All users already have Watch Later playlists. Migration complete.');
      return;
    }

    // Create Watch Later playlists for each user
    const watchLaterPlaylists = usersWithoutWatchLater.map(user => ({
      userId: user.id,
      name: 'Watch Later',
      description: 'Videos you want to watch later',
      privacy: 'PRIVATE' as const,
      videoCount: 0,
      viewCount: BigInt(0)
    }));

    await prisma.playlist.createMany({
      data: watchLaterPlaylists
    });

    console.log(`Successfully created ${watchLaterPlaylists.length} Watch Later playlists`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  createWatchLaterPlaylistsForExistingUsers()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default createWatchLaterPlaylistsForExistingUsers;
