'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Detect the project framework and configuration.
 * @param {string} projectDir
 * @returns {{ framework, hasNextAuth, routerType, envFile, packageJson }}
 */
function detectProject(projectDir) {
  const result = {
    framework: null,
    hasNextAuth: false,
    routerType: null,   // 'app' or 'pages'
    envFile: null,       // which .env file to use
    packageJson: null,
  };

  // Read package.json
  const pkgPath = path.join(projectDir, 'package.json');
  try {
    result.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return result;
  }

  const deps = {
    ...result.packageJson.dependencies,
    ...result.packageJson.devDependencies,
  };

  // Detect Next.js
  if (deps['next']) {
    result.framework = 'nextjs';

    // Detect router type
    if (fs.existsSync(path.join(projectDir, 'app'))) {
      result.routerType = 'app';
    } else if (fs.existsSync(path.join(projectDir, 'src', 'app'))) {
      result.routerType = 'app';
    } else if (fs.existsSync(path.join(projectDir, 'pages'))) {
      result.routerType = 'pages';
    } else {
      result.routerType = 'app'; // default to App Router for new projects
    }

    // Check for next-auth
    result.hasNextAuth = !!(deps['next-auth'] || deps['@auth/core']);
  }

  // Determine .env file
  // Next.js prefers .env.local for secrets
  if (result.framework === 'nextjs') {
    result.envFile = path.join(projectDir, '.env.local');
  } else {
    result.envFile = path.join(projectDir, '.env');
  }

  return result;
}

/**
 * Check if a NextAuth route file already exists.
 */
function hasExistingAuthRoute(projectDir, routerType) {
  if (routerType === 'app') {
    return fs.existsSync(path.join(projectDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts'))
      || fs.existsSync(path.join(projectDir, 'app', 'api', 'auth', '[...nextauth]', 'route.js'));
  }
  return fs.existsSync(path.join(projectDir, 'pages', 'api', 'auth', '[...nextauth].ts'))
    || fs.existsSync(path.join(projectDir, 'pages', 'api', 'auth', '[...nextauth].js'));
}

module.exports = { detectProject, hasExistingAuthRoute };
