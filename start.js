#!/usr/bin/env node

/**
 * Startup script for FabZClean Web Application
 * This ensures the correct server starts regardless of deployment configuration
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'server', 'index.ts');

console.log('🚀 Starting FabZClean Web Server...');
console.log('📁 Server path:', serverPath);

// Start the server using tsx
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});
