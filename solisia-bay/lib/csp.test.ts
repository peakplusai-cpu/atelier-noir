import assert from "node:assert/strict";
import { test } from "node:test";
import { allowedImageUrl, contentSecurityPolicy, supabaseStorageOrigin } from "./csp.ts";

const origin = "https://wgrwwuyxhdyakchuiubi.supabase.co";

test("supabase image host is the exact project origin", () => {
  assert.equal(supabaseStorageOrigin(`${origin}/`), origin);
  assert.equal(supabaseStorageOrigin("http://wgrwwuyxhdyakchuiubi.supabase.co"), "");
  assert.equal(supabaseStorageOrigin("https://*.supabase.co"), "");
  assert.equal(supabaseStorageOrigin(""), "");
  const csp = contentSecurityPolicy(origin);
  assert.match(csp, new RegExp(`img-src [^;]*${origin.replace(/\./g, "\\.")}`));
  assert.equal(csp.includes("*.supabase.co"), false);
  assert.equal(contentSecurityPolicy("").includes(origin), false);
});

test("stored image urls stay on our upload bucket", () => {
  assert.equal(allowedImageUrl("/media/abc-1.jpg", origin), true);
  assert.equal(allowedImageUrl(`${origin}/storage/v1/object/public/solisia-uploads/a.jpg`, origin), true);
  assert.equal(allowedImageUrl(`${origin}/storage/v1/object/public/radiant-uploads/a.jpg`, origin), false);
  assert.equal(allowedImageUrl("https://evil.example/a.jpg", origin), false);
  assert.equal(allowedImageUrl("/media/../secret.jpg", origin), false);
  assert.equal(allowedImageUrl("javascript:alert(1)", origin), false);
});
