import { assertEquals } from "jsr:@std/assert";
import { create_dbf_field_value } from "../src/index.ts";

Deno.test("create_dbf_field_value", () => {
  const number_value = create_dbf_field_value("76290.09", 17, "right");
  // deno-fmt-ignore
  assertEquals(
    number_value,
    new Uint8Array([
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x37, 
    0x36, 0x32, 0x39, 0x30, 0x2E, 0x30, 0x39]),
  );
  const text_value = create_dbf_field_value("地块", 10);
  assertEquals(
    text_value,
    // deno-fmt-ignore
    new Uint8Array([0xE5, 0x9C, 0xB0, 0xE5, 0x9D, 0x97, 0x20, 0x20, 0x20, 0x20]),
  );
});
