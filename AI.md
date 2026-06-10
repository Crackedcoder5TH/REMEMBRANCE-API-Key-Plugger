# OAuth Plugger — AI Instructions

> **STOP. Before doing anything else, read `ECOSYSTEM.md` in this repo's
> root.** It defines the 12-repo Remembrance ecosystem and the required
> end-to-end workflow (audit → reflect → covenant → swarm → substrate →
> ledger) for every code change. The cross-repo protocol overrides any
> per-repo conventions.

> **Applies to any AI agent working in this repo** (Claude, Cursor,
> Aider, Continue, Windsurf, Cody, etc.). `CLAUDE.md` is a pointer to
> this file — instructions are tool-neutral.


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

## What This Repo Is

A standalone CLI that auto-configures OAuth providers for Next.js
projects. Given OAuth credentials, it plugs them into `.env` files,
generates NextAuth.js route files, and creates any missing config —
zero external dependencies.

This package functions independently of the rest of the Remembrance
Ecosystem.

## Quick Reference

```bash
npx oauth-plugger init
npx oauth-plugger add google
npx oauth-plugger add github --client-id <id> --client-secret <secret>
npx oauth-plugger status
node --test tests/*.test.js
```

## Key rules for agents working here

- **Never transmit credentials anywhere.** `.env.local` and the
  generated NextAuth route file stay on the user's host. Do not add
  any code that POSTs, logs, or sends credentials to a third party.
- **Never overwrite existing env values.** New providers merge into
  `.env.local`; existing values are preserved.
- **Mask secrets in CLI output** (`test****cret` style). Do not
  introduce code that prints raw secrets.
- `.env` and `.env.local` must always be in `.gitignore`. Do not let
  them slip in.

## Supported providers

Google, GitHub, Facebook, Discord, Twitter/X, custom OIDC.

## Requirements

- Node.js 18+
- Next.js project (App Router or Pages Router)
- Zero external dependencies — keep it that way
