#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building Netlify functions...');

// List of simple functions that work standalone
const simpleFunctions = [
  'customers-simple.ts',
  'orders-simple.ts', 
  'dashboard-metrics-simple.ts',
  'due-date-orders.ts'
];

// Clean up old compiled files
const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');

// Remove all .js files except the ones we want to keep
const allFiles = fs.readdirSync(functionsDir);
allFiles.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(functionsDir, file);
    fs.unlinkSync(filePath);
    console.log(`Removed old file: ${file}`);
  }
});

// Compile each simple function individually using esbuild for better compatibility
simpleFunctions.forEach(file => {
  const filePath = path.join(functionsDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const outputFile = file.replace('.ts', '.js');
      execSync(`npx esbuild ${filePath} --bundle --platform=node --target=node18 --format=cjs --outfile=netlify/functions/${outputFile}`, { stdio: 'inherit' });
      console.log(`✅ Compiled ${file} -> ${outputFile}`);
    } catch (error) {
      console.error(`❌ Failed to compile ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

console.log('Netlify functions build complete!');
