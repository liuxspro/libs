import { assertEquals } from "jsr:@std/assert";
import { round_to } from "../src/utils/math.ts";

Deno.test("Math: round_to", () => {
  assertEquals(round_to(1.234, 2), 1.23);
  assertEquals(round_to(2.55, 1), 2.6);
  assertEquals(round_to(1.55, 1), 1.6);
  assertEquals(round_to(-2.675, 2), -2.68);
  assertEquals(round_to(-0, 2), -0);
  assertEquals(round_to(0, 2), 0);
  assertEquals(round_to(9.8250, 2), 9.83);
});
