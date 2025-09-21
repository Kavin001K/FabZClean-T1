#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the connection to your Neon PostgreSQL database
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { testConnection, getDatabaseInfo, pingDatabase } from '../server/db-utils';

async function main() {
  console.log('🚀 Testing FabZClean Database Connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Test ping
    console.log('\n2. Testing database ping...');
    const pingResult = await pingDatabase();
    console.log(`   Latency: ${pingResult.latency}`);
    
    // Get database info
    console.log('\n3. Getting database information...');
    const dbInfo = await getDatabaseInfo();
    console.log('   Database Version:', dbInfo.version?.version);
    console.log('   Current Time:', dbInfo.currentTime?.current_time);
    console.log('   Active Connections:', dbInfo.connections?.active_connections);
    
    console.log('\n✅ All database tests passed!');
    console.log('🎉 Your FabZClean application is ready to connect to the database.');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
