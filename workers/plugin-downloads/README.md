# Plugin download counter

Cloudflare Worker on `gephi.org/gephi-plugins/plugins/*`, where Gephi's Plugin Manager and the plugin pages of this
website download plugins from. It passes every request through to GitHub Pages unchanged and counts `.nbm` and `.zip`
downloads per file, client (`gephi`, `browser` or `other`) and day in a D1 database. Requests from the gephi-plugins
release build are not counted.

## Deploy

```
npm install
npx wrangler login
npx wrangler d1 create gephi-plugin-downloads   # first time: put the returned database_id in wrangler.toml
npx wrangler d1 execute gephi-plugin-downloads --remote --file schema.sql
npm run deploy
```

The route `gephi.org/gephi-plugins/plugins/*` is created once, outside wrangler (Workers Routes of the gephi.org zone in
the Cloudflare dashboard, or the API), with its request limit failure mode set to "Fail open"
(`request_limit_fail_open: true`), so plugin downloads keep working if the Workers Free daily limit is reached. It isn't
in `wrangler.toml` because `wrangler deploy` recreates the routes it declares, which resets that setting.

## Query

```
npx wrangler d1 execute gephi-plugin-downloads --remote --command \
  "SELECT file, client, SUM(count) AS downloads FROM downloads GROUP BY file, client ORDER BY downloads DESC"
```
