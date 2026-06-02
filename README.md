# OAuth Plugger

CLI that auto-configures OAuth providers for Next.js projects. Given your OAuth credentials, it plugs them into `.env` files, generates NextAuth.js route files, and creates any missing config — zero external dependencies.

> **A [Remembrance.LLC](#about-remembrancellc) project.**
> **Part of the [Remembrance Ecosystem](https://github.com/Crackedcoder5TH/Void-Data-Compressor)** —
> reference implementation of [Coherency Protocol v1.0](https://github.com/Crackedcoder5TH/Void-Data-Compressor/blob/main/COHERENCY_PROTOCOL.md).
> **Role**: standalone OAuth-configuration CLI used by other ecosystem repos to wire NextAuth into Next.js apps. Functions independently of the rest of the ecosystem.


---

## The shape at every scale

**Show it something. It tells you what that resembles in everything already proven. What coheres, it keeps. What it keeps makes the next answer truer.**

The loop is the same at every scale — *encounter → match against what's proven → does it cohere? → what survives is remembered.* This repo is one beat of that loop. Read its specific role below; remember it's the same loop, zoomed.

| Scale | encounter | match against proven | cohere? | what survives is remembered |
|---|---|---|---|---|
| **A pattern** | a snippet arrives | encode it, compare to the verified library | resonance score | if it runs + passes, it joins the library |
| **An agent** | proposes a solution | scored against proven patterns | coherency + safety + execution | strong proposals become patterns |
| **A council** | many agents answer | cross-checked against each other's tests | consensus + agreement | the winner can teach the covenant |
| **The field** | every reading flows in | integrated into one conserved scalar | global coherency rises or thins | what's measured reshapes what's trusted |
| **A field-of-fields** | many fields federate | each absorbs the others' aggregate | the network coheres | truth converges across independent sources |

That recursion is *why* anti-hallucination is emergent rather than a feature: an invented function, a fabricated citation, a claim nothing supports — they all fail the same test at every scale, so they don't survive the loop and aren't kept. The defense against fabrication is identical to the definition of the system.

---

## Quick Start

```bash
# Initialize in your Next.js project
npx oauth-plugger init

# Add providers
npx oauth-plugger add google
npx oauth-plugger add github --client-id <id> --client-secret <secret>

# Check status
npx oauth-plugger status
```

## Commands

| Command | Description |
|---------|-------------|
| `plugger init` | Detect project type, create `.env.local`, generate NextAuth route |
| `plugger add <provider>` | Add an OAuth provider (interactive or via flags) |
| `plugger list` | List configured OAuth providers |
| `plugger status` | Show config completeness and file status |
| `plugger remove <provider>` | Remove an OAuth provider |

## Supported Providers

| Provider | Command |
|----------|---------|
| Google | `plugger add google` |
| GitHub | `plugger add github` |
| Facebook | `plugger add facebook` |
| Discord | `plugger add discord` |
| Twitter/X | `plugger add twitter` |
| Custom OIDC | `plugger add custom --name myoidc --issuer https://...` |

## Usage

### Interactive Mode (default)

```bash
plugger add google
# Prompts for Client ID and Client Secret
```

### Non-Interactive (CI/scripting)

```bash
plugger add google --client-id YOUR_ID --client-secret YOUR_SECRET
```

### Custom OIDC Provider

```bash
plugger add custom \
  --name okta \
  --client-id YOUR_ID \
  --client-secret YOUR_SECRET \
  --issuer https://your-org.okta.com
```

### Target a Different Directory

```bash
plugger init --dir /path/to/project
plugger add google --dir /path/to/project
```

## What It Does

1. **`plugger init`** detects your Next.js project (App Router / Pages Router), creates `.env.local` with `NEXTAUTH_SECRET` and `NEXTAUTH_URL`, generates the `[...nextauth]/route.ts` file, and ensures `.gitignore` covers `.env` files.

2. **`plugger add <provider>`** collects credentials (interactively or via flags), merges them into `.env.local` without overwriting existing values, and regenerates the NextAuth route file with all configured providers.

3. **`plugger remove <provider>`** removes the provider's env vars and updates the route file.

## Security

- Secrets are masked in CLI output (`test****cret`)
- `.env` and `.env.local` are auto-added to `.gitignore`
- `NEXTAUTH_SECRET` is auto-generated with `crypto.randomBytes(32)`
- Existing env values are never overwritten

## Requirements

- Node.js 18+
- Next.js project (App Router or Pages Router)
- Zero external dependencies

## Testing

```bash
node --test tests/*.test.js
```

## License

MIT

---

## About Remembrance.LLC

Published by **Remembrance.LLC** as the OAuth-configuration tool for
the Remembrance Ecosystem. Code is MIT-licensed. The CLI **never
transmits credentials anywhere** — `.env.local` and the generated
NextAuth route file stay on the user's host.

---

*© Remembrance.LLC. MIT-licensed.*

---

## Remembrance Field Participation

This repo participates in the unified Remembrance field. Any
pattern-bearing data submitted here is encoded by the canonical
`codeToWaveform` (no parallel encoders — Void contract **C-53**),
scored against the field, and contributes to the same canonical
`.remembrance/entropy.json` shared by the 12-repo ecosystem.

- Protocol: [`ECOSYSTEM.md`](https://github.com/Crackedcoder5TH/remembrance-oracle-toolkit/blob/main/ECOSYSTEM.md) at the hub
- Operational reference: [`FIELD.md`](https://github.com/Crackedcoder5TH/remembrance-oracle-toolkit/blob/main/FIELD.md) at the hub
- Engineering covenant: non-negotiable (one canonical encoder, one
  canonical field file, coherence ≤ 0.999, cascade ≤ 5.0, every
  producer contributes, no side-artifacts where the substrate can
  hold the data)
