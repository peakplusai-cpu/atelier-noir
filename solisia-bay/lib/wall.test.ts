import assert from "node:assert/strict";
import { test } from "node:test";
import { wallFrames } from "./wall.ts";
import type { Product } from "./types.ts";
import type { WallPost } from "./promos.ts";

const product = { slug: "clack-box-tee", name: "Box Tee", status: "published" } as Product;

function post(partial: Partial<WallPost>): WallPost {
  return {
    id: "wall_1",
    image: "/media/session.jpg",
    caption: "One",
    slug: "clack-box-tee",
    published: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("the public wall repeats a short set and only links published products", () => {
  const frames = wallFrames([post({}), post({ id: "wall_2", slug: "javascript:alert(1)", caption: "Loose" })], [product]);
  assert.ok(frames.length >= 6);
  assert.equal(frames[0].href, "/products/clack-box-tee");
  assert.equal(frames[1].href, "");
  assert.equal(frames[1].caption, "Loose");
});

test("unpublished posts and foreign image hosts stay off the wall", () => {
  const frames = wallFrames(
    [
      post({ published: false }),
      post({ id: "wall_x", image: "https://evil.example/a.jpg" }),
      post({ id: "wall_y", image: "javascript:alert(1)" }),
    ],
    [product]
  );
  assert.deepEqual(frames, []);
});
