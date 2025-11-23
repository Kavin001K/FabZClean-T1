/**
 * Centralized Configuration Management for FabZClean
 * Configured for self-hosted Ubuntu server deployment
 */

// Note: dotenv should be loaded by the application entry point (server/index.ts)
// Configuration is read from process.env which is populated by:
// - Production: Environment variables from system environment or .env file
// - Development: .env file loaded by dotenv in the entry point

export interface AppConfig {
  nodeEnv: string;
  databaseUrl?: string;
  externalApiKey?: string;
  externalApiBaseUrl?: string;
  isProduction: boolean;
  isDevelopment: boolean;
  staticIP?: string;
  port: number;
  host: string;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  externalApiKey: process.env.EXTERNAL_API_KEY,
  externalApiBaseUrl: process.env.EXTERNAL_API_BASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  staticIP: process.env.STATIC_IP,
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
};

/**
 * Validate configuration at runtime
 * Throws error for critical missing variables
 * Logs warnings for optional variables
 */
function validateConfig(): void {
  const required: (keyof AppConfig)[] = [];
  const missing: string[] = [];

  // Check required variables
  for (const key of required) {
    const value = config[key];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missing.push(key.toUpperCase());
    }
  }

  // Only require DATABASE_URL in production
  if (config.isProduction) {
    if (!config.databaseUrl) {
      missing.push('DATABASE_URL');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required configuration: ${missing.join(', ')}\n` +
      `Please set these environment variables before starting the application.`
    );
  }

  // Warn about optional but recommended variables
  if (!config.externalApiKey) {
    console.warn(
      '⚠️  EXTERNAL_API_KEY not set - external API features will be disabled'
    );
  }

  if (!config.externalApiBaseUrl) {
    console.warn(
      '⚠️  EXTERNAL_API_BASE_URL not set - external API features will be disabled'
    );
  }

  // Log environment info
  console.log(
    `📝 Environment: ${config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`
  );
  console.log(
    `🚀 Deployment: Self-hosted Ubuntu Server`
  );
  if (config.staticIP) {
    console.log(`🌐 Static IP: ${config.staticIP}`);
  }
}

validateConfig();

/**
 * Check if external API is available
 */
export function isExternalApiAvailable(): boolean {
  return !!(config.externalApiKey && config.externalApiBaseUrl);
}

/**
 * Get external API configuration
 * Returns null if not configured
 */
export function getExternalApiConfig(): {
  apiKey: string;
  baseUrl: string;
} | null {
  if (!isExternalApiAvailable()) {
    return null;
  }
  return {
    apiKey: config.externalApiKey!,
    baseUrl: config.externalApiBaseUrl!,
  };
}

