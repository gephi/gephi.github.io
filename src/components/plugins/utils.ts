import type { Plugin } from "../../type";

export function pluginElementId(id: string) {
  return `gephi-plugin-${id}`;
}

function parseGephiVersion(v: string): [number, number] {
  const parts = v.split(".").map((n) => parseInt(n, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0];
}

// Gephi 0.10+ no longer differentiates plugin builds at the patch level, so we
// only keep major.minor for those. Pre-0.10 ("legacy") builds did differentiate
// per patch, so we keep their full version string.
export function isLegacyGephiVersion(v: string): boolean {
  const [major, minor] = parseGephiVersion(v);
  return major === 0 && minor < 10;
}

export function normalizeGephiVersion(v: string): string {
  if (isLegacyGephiVersion(v)) return v;
  const [major, minor] = parseGephiVersion(v);
  return `${major}.${minor}`;
}

export function pluginHasModernVersion(p: Plugin): boolean {
  return Object.keys(p.versions).some((v) => !isLegacyGephiVersion(v));
}

// Descending comparator so the most recent version sorts first, regardless of
// the order versions happen to appear in the source data.
export function compareGephiVersionsDesc(a: string, b: string): number {
  const aParts = a.split(".").map((n) => parseInt(n, 10) || 0);
  const bParts = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (bParts[i] ?? 0) - (aParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Groups a plugin's versions by normalized tag, keeping the most recently
// updated build per tag.
export function groupPluginVersionsByTag(versions: Plugin["versions"]): Record<string, Plugin["versions"][string]> {
  return Object.entries(versions).reduce<Record<string, Plugin["versions"][string]>>((acc, [v, info]) => {
    const tag = normalizeGephiVersion(v);
    if (!acc[tag] || new Date(info.last_update) >= new Date(acc[tag].last_update)) acc[tag] = info;
    return acc;
  }, {});
}

export async function getLatestGephiVersion(): Promise<string | null> {
  try {
    const resp = await fetch("https://api.github.com/repos/gephi/gephi/releases/latest");
    const data = (await resp.json()) as { tag_name: string };
    return normalizeGephiVersion(data.tag_name.replace(/^v/, ""));
  } catch (err) {
    console.log("Failed to fetch the latest Gephi release version from GitHub.", err);
    return null;
  }
}
