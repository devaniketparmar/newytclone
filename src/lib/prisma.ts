import { PrismaClient } from '@prisma/client';
import { initializeDatabase, getPrisma as getDbManager } from '../utils/database';

// Global variable to store Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Get or create Prisma client instance
export const getPrisma = (): PrismaClient => {
  // In development, use global variable to prevent multiple instances
  if (process.env.NODE_ENV === 'development') {
    if (!global.__prisma) {
      global.__prisma = createPrismaClient();
    }
    return global.__prisma;
  }
  
  // In production, create new instance
  return createPrismaClient();
};

// Initialize database and return Prisma client
export const initializePrisma = async (): Promise<PrismaClient> => {
  try {
    // Initialize database (creates tables, etc.)
    await initializeDatabase();
    
    // Get Prisma client
    const prisma = getPrisma();
    
    // Test connection
    await prisma.$connect();
    
    return prisma;
  } catch (error) {
    console.error('❌ Failed to initialize Prisma:', error);
    throw error;
  }
};

// Auto-initialize in server environment
let prismaInstance: PrismaClient | null = null;

export const getInitializedPrisma = async (): Promise<PrismaClient> => {
  if (!prismaInstance) {
    prismaInstance = await initializePrisma();
  }
  return prismaInstance;
};

// Graceful shutdown
export const disconnectPrisma = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};

// Health check
export const checkPrismaHealth = async (): Promise<boolean> => {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Prisma health check failed:', error);
    return false;
  }
};

// Export default instance
export const prisma = getPrisma();

// Auto-initialize on import in server environment
if (typeof window === 'undefined') {
  // Server-side initialization
  initializePrisma().catch(error => {
    console.error('❌ Auto-initialization failed:', error);
  });
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Prisma...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down Prisma...');
  await disconnectPrisma();
  process.exit(0);
});
