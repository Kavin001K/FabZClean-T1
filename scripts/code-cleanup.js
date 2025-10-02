#!/usr/bin/env node

/**
 * Code Cleanup Utility
 * 
 * Performs automated code cleanup tasks including:
 * - Adding missing test IDs
 * - Standardizing component documentation
 * - Checking for accessibility attributes
 * - Validating naming conventions
 * 
 * Usage: node scripts/code-cleanup.js [options]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'client', 'src'),
  extensions: ['.tsx', '.ts'],
  excludeDirs: ['node_modules', 'dist', '.git'],
  testIdPattern: /data-testid="([^"]+)"/g,
  componentPattern: /export\s+(default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g,
  ariaPattern: /aria-[a-z]+="[^"]*"/g,
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const isValidFile = (filePath) => {
  const ext = path.extname(filePath);
  return CONFIG.extensions.includes(ext);
};

const shouldSkipDirectory = (dirName) => {
  return CONFIG.excludeDirs.includes(dirName);
};

// File analysis functions
const analyzeFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  
  const analysis = {
    path: relativePath,
    fullPath: filePath,
    content,
    issues: [],
    suggestions: [],
    stats: {
      lines: content.split('\n').length,
      testIds: 0,
      components: 0,
      ariaAttributes: 0,
    }
  };

  // Count test IDs
  const testIdMatches = content.match(CONFIG.testIdPattern);
  analysis.stats.testIds = testIdMatches ? testIdMatches.length : 0;

  // Count components
  const componentMatches = content.match(CONFIG.componentPattern);
  analysis.stats.components = componentMatches ? componentMatches.length : 0;

  // Count ARIA attributes
  const ariaMatches = content.match(CONFIG.ariaPattern);
  analysis.stats.ariaAttributes = ariaMatches ? ariaMatches.length : 0;

  // Check for issues
  checkForIssues(analysis);
  
  return analysis;
};

const checkForIssues = (analysis) => {
  const { content, path: filePath } = analysis;

  // Check for missing test IDs on interactive elements
  const interactiveElements = [
    'button', 'input', 'select', 'textarea', 'a', 'form'
  ];
  
  interactiveElements.forEach(element => {
    const elementRegex = new RegExp(`<${element}[^>]*>`, 'gi');
    const matches = content.match(elementRegex);
    
    if (matches) {
      matches.forEach(match => {
        if (!match.includes('data-testid')) {
          analysis.issues.push({
            type: 'missing-test-id',
            severity: 'warning',
            message: `Missing test ID on ${element} element`,
            element: match.trim(),
            line: getLineNumber(content, match)
          });
        }
      });
    }
  });

  // Check for missing JSDoc comments on exported components
  const exportedComponents = content.match(CONFIG.componentPattern);
  if (exportedComponents) {
    exportedComponents.forEach(match => {
      const componentName = match.split(/\s+/).pop();
      const componentIndex = content.indexOf(match);
      const beforeComponent = content.substring(0, componentIndex);
      const lines = beforeComponent.split('\n');
      const lastFewLines = lines.slice(-5).join('\n');
      
      if (!lastFewLines.includes('/**') || !lastFewLines.includes('@component')) {
        analysis.issues.push({
          type: 'missing-documentation',
          severity: 'info',
          message: `Component ${componentName} is missing JSDoc documentation`,
          component: componentName,
          line: lines.length
        });
      }
    });
  }

  // Check for accessibility issues
  const buttonElements = content.match(/<button[^>]*>/gi);
  if (buttonElements) {
    buttonElements.forEach(button => {
      if (!button.includes('aria-label') && !button.includes('aria-labelledby')) {
        analysis.issues.push({
          type: 'missing-aria-label',
          severity: 'warning',
          message: 'Button missing aria-label or aria-labelledby',
          element: button.trim(),
          line: getLineNumber(content, button)
        });
      }
    });
  }

  // Check for console.log statements
  const consoleLogMatches = content.match(/console\.log\([^)]*\)/g);
  if (consoleLogMatches) {
    consoleLogMatches.forEach(match => {
      analysis.issues.push({
        type: 'console-log',
        severity: 'warning',
        message: 'Console.log statement found - should be removed in production',
        statement: match,
        line: getLineNumber(content, match)
      });
    });
  }

  // Check naming conventions
  checkNamingConventions(analysis);
};

const checkNamingConventions = (analysis) => {
  const { content } = analysis;
  
  // Check for non-PascalCase component names
  const componentDeclarations = content.match(/(?:function|const)\s+([a-z][a-zA-Z0-9]*)/g);
  if (componentDeclarations) {
    componentDeclarations.forEach(declaration => {
      const name = declaration.split(/\s+/).pop();
      if (name && /^[a-z]/.test(name)) {
        analysis.issues.push({
          type: 'naming-convention',
          severity: 'info',
          message: `Component name '${name}' should use PascalCase`,
          name,
          line: getLineNumber(content, declaration)
        });
      }
    });
  }

  // Check for non-camelCase variable names
  const variableDeclarations = content.match(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)/g);
  if (variableDeclarations) {
    variableDeclarations.forEach(declaration => {
      const name = declaration.split(/\s+/).pop();
      if (name && /^[A-Z]/.test(name) && !name.match(/^[A-Z_]+$/)) {
        analysis.issues.push({
          type: 'naming-convention',
          severity: 'info',
          message: `Variable name '${name}' should use camelCase`,
          name,
          line: getLineNumber(content, declaration)
        });
      }
    });
  }
};

const getLineNumber = (content, searchString) => {
  const index = content.indexOf(searchString);
  if (index === -1) return 0;
  
  const beforeMatch = content.substring(0, index);
  return beforeMatch.split('\n').length;
};

// File traversal
const getAllFiles = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
      getAllFiles(fullPath, files);
    } else if (entry.isFile() && isValidFile(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Report generation
const generateReport = (analyses) => {
  const totalFiles = analyses.length;
  const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
  const totalTestIds = analyses.reduce((sum, analysis) => sum + analysis.stats.testIds, 0);
  const totalComponents = analyses.reduce((sum, analysis) => sum + analysis.stats.components, 0);
  const totalAriaAttributes = analyses.reduce((sum, analysis) => sum + analysis.stats.ariaAttributes, 0);

  // Group issues by type
  const issuesByType = {};
  analyses.forEach(analysis => {
    analysis.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push({
        ...issue,
        file: analysis.path
      });
    });
  });

  // Generate summary
  log('\n📊 Code Analysis Summary', 'info');
  log('═'.repeat(50), 'info');
  log(`📁 Files analyzed: ${totalFiles}`, 'info');
  log(`🧩 Components found: ${totalComponents}`, 'info');
  log(`🏷️  Test IDs found: ${totalTestIds}`, 'success');
  log(`♿ ARIA attributes found: ${totalAriaAttributes}`, 'success');
  log(`⚠️  Total issues found: ${totalIssues}`, totalIssues > 0 ? 'warning' : 'success');

  // Show issues by type
  if (totalIssues > 0) {
    log('\n🔍 Issues by Type', 'info');
    log('─'.repeat(30), 'info');
    
    Object.entries(issuesByType).forEach(([type, issues]) => {
      const severity = issues[0]?.severity || 'info';
      log(`${getIssueIcon(severity)} ${type}: ${issues.length} issues`, severity);
      
      // Show first few examples
      issues.slice(0, 3).forEach(issue => {
        log(`   📄 ${issue.file}:${issue.line} - ${issue.message}`, 'info');
      });
      
      if (issues.length > 3) {
        log(`   ... and ${issues.length - 3} more`, 'info');
      }
      log('', 'info');
    });
  }

  // Show files with most issues
  const filesByIssueCount = analyses
    .filter(analysis => analysis.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 5);

  if (filesByIssueCount.length > 0) {
    log('📋 Files needing attention', 'warning');
    log('─'.repeat(30), 'info');
    
    filesByIssueCount.forEach((analysis, index) => {
      log(`${index + 1}. ${analysis.path} (${analysis.issues.length} issues)`, 'warning');
    });
  }

  // Show recommendations
  log('\n💡 Recommendations', 'info');
  log('─'.repeat(20), 'info');
  
  if (issuesByType['missing-test-id']) {
    log('• Add data-testid attributes to interactive elements for better testing', 'info');
  }
  
  if (issuesByType['missing-documentation']) {
    log('• Add JSDoc comments to exported components', 'info');
  }
  
  if (issuesByType['missing-aria-label']) {
    log('• Add ARIA labels to buttons and interactive elements', 'info');
  }
  
  if (issuesByType['console-log']) {
    log('• Remove console.log statements from production code', 'info');
  }
  
  if (issuesByType['naming-convention']) {
    log('• Follow naming conventions (PascalCase for components, camelCase for variables)', 'info');
  }

  return {
    totalFiles,
    totalIssues,
    totalTestIds,
    totalComponents,
    totalAriaAttributes,
    issuesByType
  };
};

const getIssueIcon = (severity) => {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '•';
  }
};

// Auto-fix functions
const autoFixFile = (analysis) => {
  let { content } = analysis;
  let modified = false;

  // Auto-fix: Remove console.log statements
  const consoleLogIssues = analysis.issues.filter(issue => issue.type === 'console-log');
  consoleLogIssues.forEach(issue => {
    const regex = new RegExp(issue.statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, '// TODO: Remove console.log');
    modified = true;
  });

  // Auto-fix: Add basic test IDs to buttons without them
  const buttonRegex = /<button([^>]*?)>/gi;
  content = content.replace(buttonRegex, (match, attributes) => {
    if (!attributes.includes('data-testid')) {
      // Generate a simple test ID based on button content or class
      const classMatch = attributes.match(/className="([^"]*?)"/);
      const testId = classMatch ? 
        `button-${classMatch[1].split(' ')[0].toLowerCase()}` : 
        'button-action';
      
      modified = true;
      return `<button${attributes} data-testid="${testId}">`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(analysis.fullPath, content, 'utf8');
    log(`✅ Auto-fixed: ${analysis.path}`, 'success');
  }

  return modified;
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const shouldAutoFix = args.includes('--fix');
  const shouldShowDetails = args.includes('--verbose');

  log('🧹 Starting code cleanup analysis...', 'info');
  log(`📂 Scanning directory: ${CONFIG.srcDir}`, 'info');

  try {
    const files = getAllFiles(CONFIG.srcDir);
    log(`📄 Found ${files.length} files to analyze`, 'info');

    const analyses = files.map(analyzeFile);
    
    if (shouldAutoFix) {
      log('\n🔧 Applying auto-fixes...', 'info');
      let fixedFiles = 0;
      
      analyses.forEach(analysis => {
        if (autoFixFile(analysis)) {
          fixedFiles++;
        }
      });
      
      log(`✅ Auto-fixed ${fixedFiles} files`, 'success');
    }

    const report = generateReport(analyses);

    if (shouldShowDetails) {
      log('\n📋 Detailed Issues', 'info');
      log('═'.repeat(50), 'info');
      
      analyses.forEach(analysis => {
        if (analysis.issues.length > 0) {
          log(`\n📄 ${analysis.path}`, 'warning');
          analysis.issues.forEach(issue => {
            log(`  ${getIssueIcon(issue.severity)} Line ${issue.line}: ${issue.message}`, issue.severity);
          });
        }
      });
    }

    // Exit with error code if there are critical issues
    const criticalIssues = Object.values(report.issuesByType)
      .flat()
      .filter(issue => issue.severity === 'error');
    
    if (criticalIssues.length > 0) {
      log(`\n❌ Found ${criticalIssues.length} critical issues that need attention`, 'error');
      process.exit(1);
    } else {
      log('\n✅ Code analysis completed successfully!', 'success');
      process.exit(0);
    }

  } catch (error) {
    log(`❌ Error during analysis: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
