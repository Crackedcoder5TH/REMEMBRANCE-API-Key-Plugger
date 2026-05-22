'use strict';

const fs = require('fs');
const path = require('path');
const { log, c, colorize } = require('../utils');
const { detectProject, hasExistingAuthRoute } = require('../detect');
const { readEnv } = require('../generators/env');
const { detectConfiguredProviders } = require('../generators/nextauth');

/**
 * plugger status — show config completeness and file status.
 */
async function statusCommand(parsed, projectDir) {
  const project = detectProject(projectDir);

  console.log(`\n  ${colorize(c.bold, 'OAuth Plugger Status')}\n`);

  // Project detection
  const checkMark = colorize(c.green, '\u2713');
  const crossMark = colorize(c.red, '\u2717');
  const warnMark = colorize(c.yellow, '!');

  console.log(`  ${project.packageJson ? checkMark : crossMark} package.json`);
  console.log(`  ${project.framework ? checkMark : crossMark} Framework: ${project.framework || 'not detected'}`);

  if (project.framework === 'nextjs') {
    console.log(`  ${checkMark} Router: ${project.routerType === 'app' ? 'App Router' : 'Pages Router'}`);
    console.log(`  ${project.hasNextAuth ? checkMark : warnMark} next-auth: ${project.hasNextAuth ? 'installed' : 'not installed'}`);
  }

  // Env file
  const envPath = project.envFile || path.join(projectDir, '.env.local');
  const envExists = fs.existsSync(envPath);
  console.log(`  ${envExists ? checkMark : crossMark} ${path.basename(envPath)}`);

  if (envExists) {
    const { vars } = readEnv(envPath);
    const hasSecret = vars.NEXTAUTH_SECRET && vars.NEXTAUTH_SECRET !== '';
    const hasUrl = vars.NEXTAUTH_URL && vars.NEXTAUTH_URL !== '';
    console.log(`    ${hasSecret ? checkMark : crossMark} NEXTAUTH_SECRET`);
    console.log(`    ${hasUrl ? checkMark : crossMark} NEXTAUTH_URL`);
  }

  // Auth route
  if (project.framework === 'nextjs') {
    const hasRoute = hasExistingAuthRoute(projectDir, project.routerType);
    console.log(`  ${hasRoute ? checkMark : crossMark} NextAuth route file`);

    // Configured providers
    if (envExists) {
      const providers = detectConfiguredProviders(envPath);
      console.log(`  ${providers.length > 0 ? checkMark : warnMark} Providers: ${providers.length > 0 ? providers.join(', ') : 'none'}`);
    }
  }

  // Gitignore
  const gitignorePath = path.join(projectDir, '.gitignore');
  let gitignoreCoversEnv = false;
  try {
    const gi = fs.readFileSync(gitignorePath, 'utf8');
    gitignoreCoversEnv = gi.includes('.env') || gi.includes('.env.local') || gi.includes('.env*.local');
  } catch { /* no gitignore */ }
  console.log(`  ${gitignoreCoversEnv ? checkMark : warnMark} .gitignore covers .env`);

  // Contribute project completeness to the LRE field. cost = total
  // checks, coherence = passing/total. Each boolean above is a moving
  // number; the aggregate participates in the conserved field.
  try {
    const envPathLocal = project.envFile || path.join(projectDir, '.env.local');
    const envExistsLocal = fs.existsSync(envPathLocal);
    const checks = [
      !!project.packageJson,
      !!project.framework,
      project.framework === 'nextjs' ? !!project.hasNextAuth : true,
      envExistsLocal,
      gitignoreCoversEnv,
    ];
    const passing = checks.filter(Boolean).length;
    const enginePaths = [
      'remembrance-oracle-toolkit/src/core/field-coupling',
      path.join(__dirname, '..', '..', '..', 'remembrance-oracle-toolkit', 'src', 'core', 'field-coupling'),
    ];
    for (const p of enginePaths) {
      try {
        const { contribute } = require(p);
        contribute({ cost: checks.length, coherence: passing / checks.length, source: 'plugger:status' });
        break;
      } catch (_e) { /* try next */ }
    }
  } catch (_e) { /* best-effort */ }

  // Surface whether the local toolkit primitives are reachable. A
  // sibling-cloned toolkit lets the Plugger score patterns locally
  // (src/unified/coherency) and label them with the canonical
  // vocabulary (src/core/remembrance-lexicon) instead of always
  // round-tripping over HTTP.
  try {
    const { localCoherencyScorer, localLexicon } = require('../oracle');
    const hasCoherency = !!localCoherencyScorer();
    const hasLexicon = !!localLexicon();
    console.log(`  ${hasCoherency ? checkMark : warnMark} Local oracle coherency scorer`);
    console.log(`  ${hasLexicon ? checkMark : warnMark} Remembrance lexicon`);
  } catch (_e) { /* oracle bridge unavailable */ }

  console.log('');
}

module.exports = statusCommand;
