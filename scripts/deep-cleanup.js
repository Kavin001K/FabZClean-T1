#!/usr/bin/env node

/**
 * Deep Code Cleanup Utility for FabZClean
 * 
 * Performs comprehensive cleanup including:
 * - Removing console.log statements
 * - Cleaning up unused imports
 * - Removing duplicate files
 * - Optimizing code structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    rootDir: path.join(__dirname, '..'),
    clientSrcDir: path.join(__dirname, '..', 'client', 'src'),
    serverDir: path.join(__dirname, '..', 'server'),
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludeDirs: ['node_modules', 'dist', 'dist-server', '.git', '.next', 'build', 'coverage'],
};

// Color utilities
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Statistics tracking
const stats = {
    filesProcessed: 0,
    consoleLogsRemoved: 0,
    unusedImportsRemoved: 0,
    duplicateFilesFound: 0,
    bytesFreed: 0,
    errors: [],
};

// Get all files recursively
function getAllFiles(dir, files = []) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!CONFIG.excludeDirs.includes(entry.name)) {
                    getAllFiles(fullPath, files);
                }
            } else if (entry.isFile() && CONFIG.extensions.some(ext => entry.name.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        stats.errors.push({ path: dir, error: error.message });
    }

    return files;
}

// Remove console.log statements (but keep console.error, console.warn)
function removeConsoleLogs(content, filePath) {
    let modified = content;
    let count = 0;

    // Match console.log statements (single line and multiline)
    const patterns = [
        // Single line console.log
        /\s*console\.log\([^)]*\);?\s*\n?/g,
        // Multi-line console.log with template literals
        /\s*console\.log\(`[^`]*`\);?\s*\n?/g,
        // console.log with object spread
        /\s*console\.log\(\{[^}]*\}\);?\s*\n?/g,
    ];

    for (const pattern of patterns) {
        const matches = modified.match(pattern);
        if (matches) {
            count += matches.length;
            modified = modified.replace(pattern, '\n');
        }
    }

    // More aggressive pattern for remaining console.logs
    const aggressivePattern = /console\.log\([^;]*;/g;
    const aggressiveMatches = modified.match(aggressivePattern);
    if (aggressiveMatches) {
        for (const match of aggressiveMatches) {
            // Only remove if it's a standalone statement (not in a ternary or condition)
            const index = modified.indexOf(match);
            const prevChar = index > 0 ? modified[index - 1] : ' ';
            if (prevChar === '\n' || prevChar === ' ' || prevChar === ';' || prevChar === '{') {
                modified = modified.replace(match, '');
                count++;
            }
        }
    }

    stats.consoleLogsRemoved += count;
    return { content: modified, count };
}

// Clean up empty lines (multiple consecutive empty lines -> max 2)
function cleanupEmptyLines(content) {
    return content.replace(/\n{4,}/g, '\n\n\n');
}

// Remove unused imports (basic detection)
function removeUnusedImports(content, filePath) {
    const lines = content.split('\n');
    const importLines = [];
    const otherLines = [];
    let inImportBlock = false;

    // Separate imports from other code
    for (const line of lines) {
        if (line.trim().startsWith('import ') || inImportBlock) {
            importLines.push(line);
            inImportBlock = !line.includes(';') && !line.includes('from');
            if (line.includes("';") || line.includes('";')) {
                inImportBlock = false;
            }
        } else {
            otherLines.push(line);
        }
    }

    const codeWithoutImports = otherLines.join('\n');
    const usedImports = [];
    let removedCount = 0;

    for (const importLine of importLines) {
        // Extract imported names
        const match = importLine.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/);
        if (match) {
            const imports = match[1] || match[2];
            const importNames = imports.split(',').map(s => s.trim().split(' as ')[0].trim());

            // Check if any imported name is used in the code
            const isUsed = importNames.some(name => {
                if (!name) return true; // Keep if we can't parse
                const regex = new RegExp(`\\b${name}\\b`);
                return regex.test(codeWithoutImports);
            });

            if (isUsed) {
                usedImports.push(importLine);
            } else {
                removedCount++;
            }
        } else {
            // Keep imports we can't parse
            usedImports.push(importLine);
        }
    }

    stats.unusedImportsRemoved += removedCount;
    return {
        content: [...usedImports, '', ...otherLines].join('\n'),
        count: removedCount
    };
}

// Process a single file
function processFile(filePath, options = { removeConsole: true, cleanImports: false }) {
    try {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        let content = originalContent;
        let modified = false;

        // Remove console.log statements
        if (options.removeConsole) {
            const result = removeConsoleLogs(content, filePath);
            if (result.count > 0) {
                content = result.content;
                modified = true;
                log(`  Removed ${result.count} console.log(s) from ${path.relative(CONFIG.rootDir, filePath)}`, 'yellow');
            }
        }

        // Clean up empty lines
        const cleanedContent = cleanupEmptyLines(content);
        if (cleanedContent !== content) {
            content = cleanedContent;
            modified = true;
        }

        // Write back if modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            stats.bytesFreed += originalContent.length - content.length;
        }

        stats.filesProcessed++;
        return modified;
    } catch (error) {
        stats.errors.push({ path: filePath, error: error.message });
        return false;
    }
}

// Find duplicate/similar files
function findDuplicateFiles(files) {
    const fileHashes = new Map();
    const duplicates = [];

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const hash = simpleHash(content);

            if (fileHashes.has(hash)) {
                duplicates.push({ original: fileHashes.get(hash), duplicate: file });
                stats.duplicateFilesFound++;
            } else {
                fileHashes.set(hash, file);
            }
        } catch (error) {
            // Skip files that can't be read
        }
    }

    return duplicates;
}

// Simple hash function for content comparison
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// Files that can be safely deleted
const DELETABLE_FILES = [
    // Duplicate memoization hooks (keep .tsx version which is more comprehensive)
    'client/src/hooks/use-memoization.ts',
    // Simple excel export (keep the comprehensive one)
    'client/src/lib/excel-export.ts',
    // Error analysis report (development artifact)
    'ERROR_ANALYSIS_REPORT.md',
    // Dialog issues finder (development script)
    'find-dialog-issues.sh',
    // Docs consolidation (one-time script)
    'docs-consolidation.sh',
    // Alembic config (not used - SQLite/Drizzle is used instead)
    'alembic.ini',
];

// Files to check for potential removal (need manual review)
const REVIEW_FILES = [
    'supabase-env-template.txt',
    'env.example', // duplicate of .env.example
    'server/mongo-db.ts', // MongoDB not used (SQLite is primary)
    'server/neon-rest-api.ts', // Neon not used (SQLite is primary)
    'server/database.ts', // Might be unused
];

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verbose = args.includes('--verbose');
    const deleteFiles = args.includes('--delete-unused');

    log('\n🧹 FabZClean Deep Code Cleanup', 'cyan');
    log('═'.repeat(50), 'cyan');

    if (dryRun) {
        log('⚠️  DRY RUN MODE - No files will be modified', 'yellow');
    }

    // Step 1: Remove console.log statements
    log('\n📋 Step 1: Removing console.log statements...', 'blue');

    const clientFiles = getAllFiles(CONFIG.clientSrcDir);
    const serverFiles = getAllFiles(CONFIG.serverDir);
    const allFiles = [...clientFiles, ...serverFiles];

    log(`Found ${allFiles.length} files to process`, 'cyan');

    if (!dryRun) {
        for (const file of allFiles) {
            processFile(file, { removeConsole: true });
        }
    }

    // Step 2: Find duplicates
    log('\n📋 Step 2: Finding duplicate files...', 'blue');
    const duplicates = findDuplicateFiles(allFiles);

    if (duplicates.length > 0) {
        log(`Found ${duplicates.length} potential duplicate file(s):`, 'yellow');
        for (const dup of duplicates) {
            log(`  Original: ${path.relative(CONFIG.rootDir, dup.original)}`, 'cyan');
            log(`  Duplicate: ${path.relative(CONFIG.rootDir, dup.duplicate)}`, 'yellow');
        }
    }

    // Step 3: Delete known unused files
    if (deleteFiles && !dryRun) {
        log('\n📋 Step 3: Removing unused files...', 'blue');

        for (const file of DELETABLE_FILES) {
            const fullPath = path.join(CONFIG.rootDir, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const fileStats = fs.statSync(fullPath);
                    fs.unlinkSync(fullPath);
                    stats.bytesFreed += fileStats.size;
                    log(`  ✓ Deleted: ${file}`, 'green');
                } catch (error) {
                    log(`  ✗ Failed to delete: ${file} - ${error.message}`, 'red');
                }
            }
        }
    }

    // Step 4: Report files needing manual review
    log('\n📋 Files requiring manual review:', 'blue');
    for (const file of REVIEW_FILES) {
        const fullPath = path.join(CONFIG.rootDir, file);
        if (fs.existsSync(fullPath)) {
            log(`  ⚠️  ${file}`, 'yellow');
        }
    }

    // Print summary
    log('\n📊 Cleanup Summary', 'cyan');
    log('─'.repeat(30), 'cyan');
    log(`Files processed: ${stats.filesProcessed}`, 'green');
    log(`Console.logs removed: ${stats.consoleLogsRemoved}`, 'green');
    log(`Duplicate files found: ${stats.duplicateFilesFound}`, 'yellow');
    log(`Bytes freed: ${(stats.bytesFreed / 1024).toFixed(2)} KB`, 'green');

    if (stats.errors.length > 0) {
        log(`\n⚠️  Errors encountered: ${stats.errors.length}`, 'red');
        if (verbose) {
            for (const error of stats.errors) {
                log(`  ${error.path}: ${error.error}`, 'red');
            }
        }
    }

    log('\n✅ Cleanup complete!', 'green');
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
