import assert from "node:assert/strict";
import test from "node:test";
import { newestFirst, productGenders, productsFor } from "./catalog.ts";
import type { Product } from "./types.ts";

function item(partial: Partial<Product>): Product {
  return {
    slug: "pants",
    name: "Pants",
    gender: "men",
    style: "pants",
    price: 649,
    tagline: "",
    description: "",
    details: [],
    care: [],
    colors: [],
    selectors: [],
    charts: ["men"],
    models: [],
    art: ["pants"],
    finish: "solid",
    lookWith: [],
    ...partial,
  };
}

test("unisex products appear in women, men, and shop all", () => {
  const pants = item({ slug: "washed-loose-jeans", genders: ["women", "men"] });
  const tee = item({ slug: "clack", name: "Clack", gender: "women", genders: undefined });
  const source = [tee, pants];
  assert.deepEqual(productGenders(pants), ["women", "men"]);
  assert.deepEqual(productGenders(tee), ["women"]);
  assert.deepEqual(productsFor("women", source).map((product) => product.slug), ["clack", "washed-loose-jeans"]);
  assert.deepEqual(productsFor("men", source).map((product) => product.slug), ["washed-loose-jeans"]);
  assert.equal(productsFor("all", source).length, 2);
});

test("newest catalog entries come first", () => {
  const source = [item({ slug: "old" }), item({ slug: "new" })];
  assert.deepEqual(newestFirst(source).map((product) => product.slug), ["new", "old"]);
  assert.equal(source[0].slug, "old");
});
