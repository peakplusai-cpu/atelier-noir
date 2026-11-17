import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

const root = join(process.cwd(), ".next", "static");

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else if (/\.(js|css|json|txt)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test("client bundle does not contain server secrets", async () => {
  const paths = await files(root);
  if (paths.length === 0) {
    if (process.env.REQUIRE_BUNDLE === "1") assert.fail("Run next build before the client-bundle secret test");
    return;
  }
  const names = ["SUPABASE_SERVICE_ROLE_KEY", "PAYPAL_CLIENT_SECRET", "STAFF_SETUP_TOKEN", "solisia_staff"];
  const values = names.map((name) => process.env[name]).filter((value): value is string => Boolean(value && value.length > 8));
  const hits: string[] = [];
  for (const path of paths) {
    const text = await readFile(path, "utf8");
    for (const name of names) {
      if (text.includes(name)) hits.push(`${name} in ${path}`);
    }
    for (const value of values) {
      if (text.includes(value)) hits.push(`secret value in ${path}`);
    }
  }
  assert.deepEqual(hits, []);
});
