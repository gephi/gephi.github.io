// Counts plugin downloads served from gephi.org/gephi-plugins/plugins/ (Gephi's Plugin Manager and the
// plugin pages of this website) per file, client and day, and serves them from GitHub Pages as before.

const PREFIX = "/gephi-plugins/plugins/";

// gephi-plugins' release build re-downloads unchanged plugins with this user agent
const RELEASE_BUILD_USER_AGENT = "Chrome/23.0.1271.95";

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const { pathname } = new URL(request.url);
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

// Gephi's Plugin Manager (NetBeans autoupdate) sends "NetBeans"
function client(userAgent) {
  if (userAgent === "NetBeans") return "gephi";
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
