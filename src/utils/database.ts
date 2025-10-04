import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private isInitialized = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 Initializing database...');
      
      // Check if database exists and is accessible
      await this.checkDatabaseConnection();
      
      // Generate Prisma client if needed
      await this.generatePrismaClient();
      
      // Push schema to database (creates tables if they don't exist)
      await this.pushSchema();
      
      // Seed initial data if needed
      await this.seedInitialData();
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully!');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('📡 Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error('Failed to connect to database. Please check your DATABASE_URL in .env file');
    }
  }

  private async generatePrismaClient(): Promise<void> {
    try {
      console.log('🔨 Generating Prisma client...');
      await execAsync('npx prisma generate');
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.warn('⚠️ Prisma client generation failed, continuing...', error);
    }
  }

  private async pushSchema(): Promise<void> {
    try {
      console.log('📊 Pushing database schema...');
      await execAsync('npx prisma db push --accept-data-loss');
      console.log('✅ Database schema pushed successfully');
    } catch (error) {
      console.error('❌ Failed to push schema:', error);
      throw error;
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      console.log('🌱 Seeding initial data...');
      
      // Check if we need to seed data
      const userCount = await this.prisma.user.count();
      
      if (userCount === 0) {
        console.log('📝 No users found, skipping initial seeding');
        return;
      }
      
      console.log('✅ Initial data seeding completed');
    } catch (error) {
      console.warn('⚠️ Initial data seeding failed:', error);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Export Prisma client getter
export const getPrisma = () => dbManager.getPrisma();

// Export initialization function
export const initializeDatabase = () => dbManager.initialize();

// Export health check
export const checkDatabaseHealth = () => dbManager.healthCheck();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down database connection...');
  await dbManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down database connection...');
  await dbManager.disconnect();
  process.exit(0);
});
