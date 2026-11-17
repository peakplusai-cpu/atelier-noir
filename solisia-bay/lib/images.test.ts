import assert from "node:assert/strict";
import { test } from "node:test";
import { sniffImage } from "./images.ts";

test("upload sniff rejects svg, html and accepts jpeg", () => {
  assert.equal(sniffImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(sniffImage(Buffer.from("<html><script>alert(1)</script></html>")), null);
  assert.equal(sniffImage(Buffer.from("GIF89a<script>")), "gif");
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.equal(sniffImage(jpeg), "jpg");
  assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])), "png");
});
