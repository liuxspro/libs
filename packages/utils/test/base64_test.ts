import { assertEquals } from "jsr:@std/assert";
import { decode, encode } from "../src/base64.ts";

Deno.test("base64 encode and decode", () => {
  const s = "hello 你好 💖";
  assertEquals(encode(s), "aGVsbG8g5L2g5aW9IPCfkpY=");
  assertEquals(decode(encode(s)), s);
});
