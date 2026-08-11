# Getting docs.oauth.fyi live

Where things stand: `docs.oauth.fyi` DNS is already pointed at Mintlify and the project is live,
but it's still serving Mintlify's placeholder content — this repo (`bot-docs`) isn't connected to
it yet. This doc is everything left to do that.

## 1. Push this repo to a git remote

`bot-docs` is a local git repo (`git init` already run, nothing committed yet) with no remote.
Mintlify's normal deploy path is a GitHub (or GitLab/Bitbucket) connection, so it needs to live
somewhere Mintlify can reach:

```bash
cd "C:\Xerz\bot-docs"
git add -A
git commit -m "Scaffold docs hub, migrate V.O.I.D + rich-existing-docs bots"
git remote add origin <your-repo-url>
git push -u origin main
```

Use whatever host/org you use for your other repos. The repo can be private — Mintlify's GitHub
App only needs read access to the one repo, not org-wide.

## 2. Point the Mintlify project at this repo

In the Mintlify dashboard, on the `docs.oauth.fyi` project:

1. **Settings → Deploys / Git connection** — connect the repo you just pushed. Since `docs.json`
   sits at the repo root (not in a subdirectory), leave the content root as `/`.
2. Set the deploy branch to `main`.
3. Mintlify will kick off a build from the current `main`. Once it finishes, `docs.oauth.fyi`
   should be serving the real site — check the product switcher shows "V.O.I.D" and that
   `docs.oauth.fyi/void/commands` renders the full command table.
4. Re-confirm **Settings → Domains** still shows `docs.oauth.fyi` as verified — connecting a new
   repo shouldn't touch domain config, but worth a glance since this is the first real deploy.

If something looks broken after the first deploy, `npx mint dev` locally (see this repo's
`README.md`) reproduces the same build and is faster to iterate against than waiting on Mintlify's
build pipeline each time.

## 3. Cut V.O.I.D's `/docs` over to the hub

V.O.I.D's dashboard already has the redirect logic built in and tested — this is purely a config
change, no code to ship. In V.O.I.D's production environment, set:

```
DOCS_BASE_URL=https://docs.oauth.fyi
```

The moment this is set, `void.oauth.fyi/docs` and `void.oauth.fyi/commands` redirect into the hub
(`.../void/...`) instead of serving V.O.I.D's built-in pages, preserving any `/docs/<page>`
sub-path so existing deep links keep working. Do this only once you're satisfied with what's live
on the hub — it takes effect immediately, no deploy needed on V.O.I.D's side.

**Do this after step 2's deploy is confirmed working**, not before — otherwise `/docs` would
redirect to a hub still showing placeholder content.

## 4. Cut Aegis's `/docs` over to the hub

Aegis's redirect route now exists too (`apps/web/src/app/(marketing)/docs/[[...slug]]/page.tsx`),
same shape as V.O.I.D's. In Aegis's `apps/web` production environment, set:

```
DOCS_BASE_URL=https://docs.oauth.fyi
```

The route appends `/aegis` itself, so use the bare domain — same as V.O.I.D. Unset, it falls back
to redirecting `/docs` to Aegis's own home page. As with V.O.I.D, do this only after step 2's
deploy is confirmed working.

The other 9 bots (SellAuth, Vouch, Updater, Ticket, KeyAuth, Invoice, News, Download, plus the
generic Sources product) have no redirect wiring — none of them have a web-facing app of their
own, so their docs are linked directly (Discord embeds, README, bot commands) rather than through
a `/docs` route.

## Open item: navbar / footer

`docs.json`'s global `navbar` and `footer` are currently both empty — the old V.O.I.D-specific
links (`void.oauth.fyi/features`, etc.) were removed since they don't generalize across products,
but nothing replaced them yet. `oauth.fyi` itself is already the SellAuth storefront's own site,
so there's no neutral hub landing page to point a global CTA at right now. Worth deciding later
whether that's worth building, or whether an empty navbar/footer (each product's own `index.mdx`
carries its own links) is fine long-term.

## Optional: direct Mintlify editing via MCP

There's a Mintlify Admin MCP connector available in this environment, but it's currently scoped to
a different, unrelated deployment (`chairz`, not `docs.oauth.fyi`). If you authorize it for the
`docs.oauth.fyi` project too, future content changes could be pushed directly (checkout → edit →
save, opens a PR or commits) without a manual `git push` + waiting on Mintlify's build — worth
doing once this repo is connected, if you want that workflow.
