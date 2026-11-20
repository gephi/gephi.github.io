// Counts plugin downloads served from gephi.org/gephi-plugins/plugins/ (Gephi's Plugin Manager and the
// plugin pages of this website) per file, client and day, and serves them from GitHub Pages as before.

const PREFIX = "/gephi-plugins/plugins/";

// Recent downloads per file, which the website's plugin list is ordered by
const STATS_PATH = `${PREFIX}downloads.json`;
const STATS_DAYS = 90;

// gephi-plugins' release build re-downloads unchanged plugins with this user agent
const RELEASE_BUILD_USER_AGENT = "Chrome/23.0.1271.95";

export default {
  async fetch(request, env, ctx) {
    const { origin, pathname } = new URL(request.url);
    if (request.method === "GET" && pathname === STATS_PATH) {
      return stats(origin, env, ctx);
    }
    const response = await fetch(request);
    const userAgent = request.headers.get("user-agent") ?? "";
    if (
      request.method === "GET" &&
      response.status === 200 &&
      pathname.startsWith(PREFIX) &&
      /\.(nbm|zip)$/.test(pathname) &&
      !userAgent.includes(RELEASE_BUILD_USER_AGENT)
    ) {
      ctx.waitUntil(count(env.DB, pathname.slice(PREFIX.length), client(userAgent)));
    }
    return response;
  },
};

// Gephi's Plugin Manager (NetBeans autoupdate) sends "NetBeans". Crawlers following the website's download
// links are "other", so they don't count in stats.
function client(userAgent) {
  if (userAgent === "NetBeans") return "gephi";
  if (/bot|crawl|spider/i.test(userAgent)) return "other";
  if (userAgent.includes("Mozilla/")) return "browser";
  return "other";
}

async function count(db, file, client) {
  try {
    await db
      .prepare(
        `INSERT INTO downloads (file, client, day, count) VALUES (?, ?, date('now'), 1)
         ON CONFLICT (file, client, day) DO UPDATE SET count = count + 1`,
      )
      .bind(file, client)
      .run();
  } catch (e) {
    console.error(`Failed to count download of ${file}`, e);
  }
}

// Downloads by Gephi and browsers over the last STATS_DAYS days, per file. Cached for an hour, under a key
// without the query string, so requests can't use up D1's daily read limit.
async function stats(origin, env, ctx) {
  const key = new Request(origin + STATS_PATH);
  const cached = await caches.default.match(key);
  if (cached) return cached;
  const { results } = await env.DB.prepare(
    `SELECT file, SUM(count) AS downloads FROM downloads INDEXED BY downloads_day
     WHERE client IN ('gephi', 'browser') AND day >= date('now', ?)
     GROUP BY file`,
  )
    .bind(`-${STATS_DAYS} days`)
    .all();
  const response = Response.json(
    { days: STATS_DAYS, downloads: Object.fromEntries(results.map((r) => [r.file, r.downloads])) },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
  ctx.waitUntil(caches.default.put(key, response.clone()));
  return response;
}
