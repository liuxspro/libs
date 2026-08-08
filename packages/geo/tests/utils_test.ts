import { assertEquals } from "jsr:@std/assert";
import { zoom_to_scale, zoom_to_scale_denominator } from "../src/utils.ts";

Deno.test("zoom_to_scale_denominator", () => {
  assertEquals(zoom_to_scale_denominator(0), 559082264.0287178);
  assertEquals(zoom_to_scale_denominator(0, 96), 591658710.9091313);
  assertEquals(zoom_to_scale_denominator(18), 2132.729583849784);
  assertEquals(zoom_to_scale_denominator(18, 96), 2256.9988666882755);
});

Deno.test("zoom_to_scale", () => {
  assertEquals(zoom_to_scale(18, 96), 0.00044306623931420635);
  assertEquals(zoom_to_scale(16, 96), 0.00011076655982855159);
});
