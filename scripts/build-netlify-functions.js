#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building Netlify functions...');

// List of simple functions that don't depend on server modules
const simpleFunctions = [
  'orders-simple.ts',
  'customers-simple.ts', 
  'dashboard-metrics-simple.ts'
];

// Clean up old compiled files
const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');
const oldFiles = fs.readdirSync(functionsDir).filter(file => 
  file.endsWith('.js') && !file.includes('simple')
);

oldFiles.forEach(file => {
  const filePath = path.join(functionsDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Removed old file: ${file}`);
  }
});

// Compile each simple function
const tscCommand = [
  'npx tsc',
  '--target ES2020',
  '--module ESNext', 
  '--moduleResolution node',
  '--allowSyntheticDefaultImports',
  '--esModuleInterop',
  '--skipLibCheck',
  '--outDir netlify/functions'
].join(' ');

simpleFunctions.forEach(file => {
  const filePath = path.join(functionsDir, file);
  if (fs.existsSync(filePath)) {
    try {
      execSync(`${tscCommand} ${filePath}`, { stdio: 'inherit' });
      console.log(`✅ Compiled ${file}`);
    } catch (error) {
      console.error(`❌ Failed to compile ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

console.log('Netlify functions build complete!');
