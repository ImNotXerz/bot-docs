# Bot documentation site

The docs site for every bot, hosted together at `docs.oauth.fyi`.

It uses Mintlify's **`products`** navigation type: every bot gets a fully independent
navigation tree — its own tabs, groups, and pages — reached through one product switcher on a
single shared domain. Nothing is shared between products except the domain, theme, and footer.

This repo replaces the docs that used to live inside V.O.I.D's own repo
(`V.O.I.D/docs`) — that project still owns its `pnpm docs:generate` script (it writes into
this repo's `void/` directory when pointed at it), but the published site itself lives here.

## Layout

Each bot owns one top-level directory, matching its `navigation.products[].tabs[].groups[].pages`
entries in `docs.json`. Every page slug for a bot **must** start with `<bot>/` — this is enforced
by `tests/navigation.test.ts`.

```
docs.json       # the master nav — one products[] entry per bot
void/           # V.O.I.D
aegis/          # Aegis
sellauth/       # SellAuth Bot
keyauth/        # KeyAuth Bot
ticket/         # Ticket Bot
vouch/          # Vouch Bot
invoice/        # Invoice Bot
news/           # News Bot
download/       # Download Bot
updater/        # Updater Bot
```

## Adding a bot

1. Create `<bot>/` with at least an `index.mdx`.
2. Add a `navigation.products[]` entry to `docs.json`:

```json
{
  "product": "Example Bot",
  "description": "One line shown in the product switcher",
  "icon": "shield",
  "tabs": [
    {
      "tab": "Documentation",
      "groups": [
        { "group": "Getting started", "pages": ["example/index", "example/quickstart"] }
      ]
    }
  ]
}
```

3. Frontmatter is minimal — just `title` and `description` on every page, nothing else.
4. Only migrate content that is meant to be public. **Mintlify's free tier has no
   authentication, so anything placed here is public** — architecture, deployment, database,
   backup, threat-model, testing, and internal-audit docs stay in the bot's own repo, not here.
   The one exception is a bot that is explicitly self-hosted by its own users, where
   configuration/deployment docs are genuinely end-user content.

## Local preview

```
npx mint dev
```

## Redirect wiring

Bots that have their own web-facing app can redirect their `/docs` route into this site once it
is live, by reading a `DOCS_BASE_URL` env var (the bare hub domain, e.g. `https://docs.oauth.fyi`)
and appending their own `/<bot>` product path. V.O.I.D (`src/dashboard/app.ts`) already does
this. Bots with no web-facing app of their own are not wired up — their docs are linked directly
from Discord embeds, READMEs, or bot commands instead.
