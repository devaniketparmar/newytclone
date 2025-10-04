import { initializeDatabase, checkDatabaseHealth } from '../utils/database';

interface StartupConfig {
  skipDatabaseInit?: boolean;
  verbose?: boolean;
}

class ApplicationStartup {
  private static instance: ApplicationStartup;
  private isInitialized = false;
  private config: StartupConfig;

  private constructor(config: StartupConfig = {}) {
    this.config = {
      skipDatabaseInit: false,
      verbose: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  public static getInstance(config?: StartupConfig): ApplicationStartup {
    if (!ApplicationStartup.instance) {
      ApplicationStartup.instance = new ApplicationStartup(config);
    }
    return ApplicationStartup.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      if (this.config.verbose) {
        console.log('🚀 Application already initialized');
      }
      return;
    }

    try {
      console.log('🚀 Starting application initialization...');
      
      // Initialize database
      if (!this.config.skipDatabaseInit) {
        await this.initializeDatabase();
      }
      
      // Perform health checks
      await this.performHealthChecks();
      
      this.isInitialized = true;
      console.log('✅ Application initialization completed successfully!');
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      throw error;
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🗄️ Initializing database...');
      await initializeDatabase();
      
      // Verify database health
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
      
      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async performHealthChecks(): Promise<void> {
    try {
      console.log('🔍 Performing health checks...');
      
      // Database health check
      const dbHealthy = await checkDatabaseHealth();
      if (!dbHealthy) {
        throw new Error('Database health check failed');
      }
      
      // Environment variables check
      this.checkEnvironmentVariables();
      
      console.log('✅ All health checks passed');
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  private checkEnvironmentVariables(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingVars);
      console.warn('📝 Please check your .env file');
    }
  }

  public async isReady(): Promise<boolean> {
    try {
      const dbHealthy = await checkDatabaseHealth();
      return this.isInitialized && dbHealthy;
    } catch (error) {
      return false;
    }
  }

  public getStatus(): { initialized: boolean; config: StartupConfig } {
    return {
      initialized: this.isInitialized,
      config: this.config
    };
  }
}

// Export singleton instance
export const appStartup = ApplicationStartup.getInstance();

// Export initialization function
export const initializeApplication = (config?: StartupConfig) => 
  appStartup.initialize();

// Export ready check
export const isApplicationReady = () => appStartup.isReady();

// Export status check
export const getApplicationStatus = () => appStartup.getStatus();

// Auto-initialize in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  initializeApplication().catch(error => {
    console.error('❌ Auto-initialization failed:', error);
  });
}
