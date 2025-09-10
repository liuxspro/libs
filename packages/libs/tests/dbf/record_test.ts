import { assertEquals } from "jsr:@std/assert";
import { record_to_uint8array } from "../../src/dbf/record.ts";
import { Field } from "../../src/dbf/mod.ts";

Deno.test(function test_record_to_uint8array() {
  const char = new Field("DMMC", "C", 10);
  const num = new Field("NUM", "N", 10);
  const data = record_to_uint8array([char, num], ["DKMC", 12]);
  assertEquals(data.length, 21);
});
