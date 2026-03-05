'use strict';

/**
 * OAuth provider definitions.
 * Each provider specifies the env vars it needs, the NextAuth import, and the provider config call.
 */
const PROVIDERS = {
  google: {
    name: 'Google',
    envVars: {
      GOOGLE_CLIENT_ID: { label: 'Client ID', secret: false },
      GOOGLE_CLIENT_SECRET: { label: 'Client Secret', secret: true },
    },
    nextauth: {
      import: 'import GoogleProvider from "next-auth/providers/google";',
      config: `GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    })`,
    },
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },

  github: {
    name: 'GitHub',
    envVars: {
      GITHUB_CLIENT_ID: { label: 'Client ID', secret: false },
      GITHUB_CLIENT_SECRET: { label: 'Client Secret', secret: true },
    },
    nextauth: {
      import: 'import GitHubProvider from "next-auth/providers/github";',
      config: `GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    })`,
    },
    docsUrl: 'https://github.com/settings/developers',
  },

  facebook: {
    name: 'Facebook',
    envVars: {
      FACEBOOK_CLIENT_ID: { label: 'App ID', secret: false },
      FACEBOOK_CLIENT_SECRET: { label: 'App Secret', secret: true },
    },
    nextauth: {
      import: 'import FacebookProvider from "next-auth/providers/facebook";',
      config: `FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    })`,
    },
    docsUrl: 'https://developers.facebook.com/apps',
  },

  discord: {
    name: 'Discord',
    envVars: {
      DISCORD_CLIENT_ID: { label: 'Client ID', secret: false },
      DISCORD_CLIENT_SECRET: { label: 'Client Secret', secret: true },
    },
    nextauth: {
      import: 'import DiscordProvider from "next-auth/providers/discord";',
      config: `DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    })`,
    },
    docsUrl: 'https://discord.com/developers/applications',
  },

  twitter: {
    name: 'Twitter/X',
    envVars: {
      TWITTER_CLIENT_ID: { label: 'Client ID', secret: false },
      TWITTER_CLIENT_SECRET: { label: 'Client Secret', secret: true },
    },
    nextauth: {
      import: 'import TwitterProvider from "next-auth/providers/twitter";',
      config: `TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID ?? "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
      version: "2.0",
    })`,
    },
    docsUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
};

/** List of built-in provider keys */
const PROVIDER_NAMES = Object.keys(PROVIDERS);

/**
 * Build a custom OIDC provider definition at runtime.
 * @param {string} name - Provider name (e.g. "myoidc")
 * @returns {object} Provider definition matching the PROVIDERS shape
 */
function buildCustomProvider(name) {
  const upper = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return {
    name: `Custom (${name})`,
    envVars: {
      [`${upper}_CLIENT_ID`]: { label: 'Client ID', secret: false },
      [`${upper}_CLIENT_SECRET`]: { label: 'Client Secret', secret: true },
      [`${upper}_ISSUER`]: { label: 'Issuer URL', secret: false },
    },
    nextauth: {
      import: `// Custom OIDC provider: ${name}\n// Uses the generic provider approach`,
      config: `{
      id: "${name}",
      name: "${name}",
      type: "oidc",
      issuer: process.env.${upper}_ISSUER ?? "",
      clientId: process.env.${upper}_CLIENT_ID ?? "",
      clientSecret: process.env.${upper}_CLIENT_SECRET ?? "",
    }`,
    },
    docsUrl: null,
    custom: true,
  };
}

/**
 * Get provider definition by name (built-in or custom).
 */
function getProvider(name) {
  const lower = name.toLowerCase();
  if (PROVIDERS[lower]) return { key: lower, ...PROVIDERS[lower] };
  return { key: lower, ...buildCustomProvider(lower) };
}

module.exports = { PROVIDERS, PROVIDER_NAMES, buildCustomProvider, getProvider };
