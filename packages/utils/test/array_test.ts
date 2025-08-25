import { assertEquals } from "jsr:@std/assert";
import { array_is_equal, mergeUint8Arrays } from "../src/array.ts";

Deno.test("mergeUint8Arrays", () => {
  const a = new Uint8Array([1, 2]);
  const b = Uint8Array.of(3);
  const c = new Uint8Array([4]);
  const m = mergeUint8Arrays([a, b, c]);
  assertEquals(m, new Uint8Array([1, 2, 3, 4]));
});

Deno.test("array_is_equal", () => {
  const arr1 = new Uint8Array([1, 2, 3]);
  const arr2 = new Uint8Array([1, 2, 3]);
  const arr3 = new Uint8Array([1, 2, 4]);
  assertEquals(array_is_equal(arr1, arr2), true);
  assertEquals(array_is_equal(arr1, arr3), false);
});
