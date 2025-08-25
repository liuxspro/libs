import { assertEquals } from "jsr:@std/assert";
import { mergeUint8Arrays } from "../src/array.ts";

Deno.test("mergeUint8Arrays", () => {
  const a = new Uint8Array([1, 2]);
  const b = Uint8Array.of(3);
  const c = new Uint8Array([4]);
  const m = mergeUint8Arrays([a, b, c]);
  assertEquals(m, new Uint8Array([1, 2, 3, 4]));
});
