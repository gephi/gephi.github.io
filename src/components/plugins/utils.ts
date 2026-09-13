import type { Plugin } from "../../type";

export function pluginElementId(id: string) {
  return `gephi-plugin-${id}`;
}

// Gephi 0.10+ no longer differentiates plugin builds at the patch level, so we
// only keep major.minor for those. Pre-0.10 ("legacy") builds did differentiate
// per patch, so we keep their full version string.
export function isLegacyGephiVersion(v: string): boolean {
  const [major, minor] = v.split(".").map((n) => parseInt(n, 10) || 0);
  return major === 0 && minor < 10;
}

export function normalizeGephiVersion(v: string): string {
  if (isLegacyGephiVersion(v)) return v;
  const [major, minor] = v.split(".").map((n) => parseInt(n, 10) || 0);
  return `${major}.${minor}`;
}

export function pluginHasModernVersion(p: Plugin): boolean {
  return Object.keys(p.versions).some((v) => !isLegacyGephiVersion(v));
}

export async function getLatestGephiVersion(): Promise<string | null> {
  try {
    const resp = await fetch("https://api.github.com/repos/gephi/gephi/releases/latest");
    const data = (await resp.json()) as { tag_name: string };
    return normalizeGephiVersion(data.tag_name.replace(/^v/, ""));
  } catch {
    return null;
  }
}
