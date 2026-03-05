'use strict';

const fs = require('fs');
const path = require('path');
const { readEnv } = require('./env');
const { PROVIDERS, getProvider } = require('../providers/registry');

/**
 * Determine which providers are configured by checking .env for non-empty client IDs.
 * @param {string} envPath - Path to .env or .env.local
 * @returns {string[]} Array of provider keys that have credentials set
 */
function detectConfiguredProviders(envPath) {
  const { vars } = readEnv(envPath);
  const configured = [];

  // Check built-in providers
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    const idVar = Object.keys(provider.envVars).find(v => v.endsWith('_CLIENT_ID'));
    if (idVar && vars[idVar] && vars[idVar] !== '') {
      configured.push(key);
    }
  }

  // Check for custom providers (pattern: <NAME>_CLIENT_ID + <NAME>_ISSUER)
  for (const [varName, value] of Object.entries(vars)) {
    if (varName.endsWith('_CLIENT_ID') && value) {
      const prefix = varName.replace(/_CLIENT_ID$/, '');
      const isBuiltIn = Object.values(PROVIDERS).some(p =>
        Object.keys(p.envVars).includes(varName)
      );
      if (!isBuiltIn && vars[`${prefix}_ISSUER`]) {
        configured.push(prefix.toLowerCase());
      }
    }
  }

  return configured;
}

/**
 * Generate the NextAuth [...nextauth]/route.ts file content.
 * @param {string[]} providerKeys - e.g. ['google', 'github']
 * @returns {string} TypeScript file content
 */
function generateRouteContent(providerKeys) {
  if (providerKeys.length === 0) {
    return `import NextAuth from "next-auth";

const handler = NextAuth({
  providers: [],
  // Add providers using: plugger add <provider>
});

export { handler as GET, handler as POST };
`;
  }

  const providers = providerKeys.map(k => getProvider(k));
  const imports = ['import NextAuth from "next-auth";'];
  const configs = [];

  for (const p of providers) {
    imports.push(p.nextauth.import);
    configs.push(`    ${p.nextauth.config},`);
  }

  return `${imports.join('\n')}

const handler = NextAuth({
  providers: [
${configs.join('\n')}
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
`;
}

/**
 * Write or update the NextAuth route file.
 * @param {string} projectDir - Project root
 * @param {string[]} providerKeys - Configured providers
 * @param {object} options - { routerType: 'app'|'pages' }
 * @returns {string} Path to the written file
 */
function writeNextAuthRoute(projectDir, providerKeys, options = {}) {
  const routerType = options.routerType || 'app';
  let routePath;

  if (routerType === 'app') {
    routePath = path.join(projectDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
  } else {
    routePath = path.join(projectDir, 'pages', 'api', 'auth', '[...nextauth].ts');
  }

  const dir = path.dirname(routePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = routerType === 'app'
    ? generateRouteContent(providerKeys)
    : generatePagesRouteContent(providerKeys);

  fs.writeFileSync(routePath, content, 'utf8');
  return routePath;
}

/**
 * Generate route content for Pages Router (pages/api/auth/[...nextauth].ts).
 */
function generatePagesRouteContent(providerKeys) {
  if (providerKeys.length === 0) {
    return `import NextAuth from "next-auth";

export default NextAuth({
  providers: [],
  // Add providers using: plugger add <provider>
});
`;
  }

  const providers = providerKeys.map(k => getProvider(k));
  const imports = ['import NextAuth from "next-auth";'];
  const configs = [];

  for (const p of providers) {
    imports.push(p.nextauth.import);
    configs.push(`    ${p.nextauth.config},`);
  }

  return `${imports.join('\n')}

export default NextAuth({
  providers: [
${configs.join('\n')}
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
`;
}

module.exports = {
  detectConfiguredProviders,
  generateRouteContent,
  generatePagesRouteContent,
  writeNextAuthRoute,
};
