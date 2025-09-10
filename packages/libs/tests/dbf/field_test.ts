import { assertEquals } from "jsr:@std/assert";
import { Field } from "../../src/dbf/mod.ts";

Deno.test("Field - 布尔型", function () {
  const r = new Field("NAME", "L");
  assertEquals(r.record_define.slice(0, 4), new Uint8Array([78, 65, 77, 69]));
  assertEquals(r.record_define.slice(11, 12), new Uint8Array([76]));
  assertEquals(r.record_define.slice(16, 17), new Uint8Array([1]));
  assertEquals(r.record_define.slice(17, 18), new Uint8Array([0]));
});

Deno.test("Field - 文本型", function () {
  const r = new Field("NAME", "C", 4);
  assertEquals(r.record_define.slice(0, 4), new Uint8Array([78, 65, 77, 69]));
  assertEquals(r.record_define.slice(11, 12), new Uint8Array([67]));
  assertEquals(r.record_define.slice(16, 17), new Uint8Array([4]));
  assertEquals(r.record_define.slice(17, 18), new Uint8Array([0]));
});

Deno.test("Field - 整数", function () {
  const r = new Field("NAME", "N", 10, 0);
  assertEquals(r.record_define.slice(0, 4), new Uint8Array([78, 65, 77, 69]));
  assertEquals(r.record_define.slice(11, 12), new Uint8Array([78]));
  assertEquals(r.record_define.slice(16, 17), new Uint8Array([10]));
  assertEquals(r.record_define.slice(17, 18), new Uint8Array([0]));
});

Deno.test("Field - 浮点数", function () {
  const r = new Field("NAME", "N", 10, 2);
  assertEquals(r.record_define.slice(0, 4), new Uint8Array([78, 65, 77, 69]));
  assertEquals(r.record_define.slice(11, 12), new Uint8Array([78]));
  assertEquals(r.record_define.slice(16, 17), new Uint8Array([11]));
  assertEquals(r.record_define.slice(17, 18), new Uint8Array([2]));
});
