import assert from "node:assert/strict";
import { test } from "node:test";
import { productBrand, productTags } from "./catalog.ts";
import type { Product } from "./types.ts";

const base = { brand: "  CLACK  ", tags: [" 滑板 ", "街舞", "滑板", ""] } as Product;

test("brand and street tags stay optional and trimmed", () => {
  assert.equal(productBrand(base), "CLACK");
  assert.deepEqual(productTags(base), ["滑板", "街舞"]);
  assert.equal(productBrand({} as Product), "");
  assert.deepEqual(productTags({} as Product), []);
});
