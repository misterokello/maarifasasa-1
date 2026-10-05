// Shared Thinkific group helpers (list, create, add member).
// deno-lint-ignore-file no-explicit-any
import { THINKIFIC_API_BASE, thinkificHeaders } from "./thinkificUsers.ts";

export interface ThinkificGroup {
  id: number;
  name: string;
  token?: string | null;
  users_count?: number | null;
}

export function readThinkificToken(): string {
  return (Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific") ?? "")
    .trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
}

export async function listThinkificGroups(apiKey: string): Promise<ThinkificGroup[]> {
  const headers = thinkificHeaders(apiKey);
  const groups: ThinkificGroup[] = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL(`${THINKIFIC_API_BASE}/groups`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`Thinkific groups fetch failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const items = (data.items || []) as ThinkificGroup[];
    groups.push(...items);
    const total = data.meta?.pagination?.total_pages ?? 1;
    if (page >= total || items.length === 0) break;
  }
  return groups;
}

export async function createThinkificGroup(apiKey: string, name: string): Promise<ThinkificGroup> {
  const res = await fetch(`${THINKIFIC_API_BASE}/groups`, {
    method: "POST",
    headers: thinkificHeaders(apiKey),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text();
    // Name already used — resolve to the existing group instead of failing.
    if (res.status === 422) {
      const existing = (await listThinkificGroups(apiKey))
        .find((g) => (g.name || "").toLowerCase() === name.toLowerCase());
      if (existing) return existing;
    }
    throw new Error(`Thinkific group create failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ThinkificGroup;
}

/** Ensures a group exists by name and returns it. */
export async function ensureThinkificGroup(apiKey: string, name: string): Promise<ThinkificGroup> {
  const existing = (await listThinkificGroups(apiKey))
    .find((g) => (g.name || "").trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;
  return await createThinkificGroup(apiKey, name.trim());
}

/** Adds a Thinkific user to a group (by group name). Idempotent-ish. */
export async function addUserToThinkificGroup(
  apiKey: string,
  groupName: string,
  userId: number,
): Promise<void> {
  const res = await fetch(`${THINKIFIC_API_BASE}/group_users`, {
    method: "POST",
    headers: thinkificHeaders(apiKey),
    body: JSON.stringify({ group_names: [groupName], user_id: userId }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 422 && /already/i.test(text)) return;
    throw new Error(`Thinkific group membership failed (${res.status}): ${text}`);
  }
}
