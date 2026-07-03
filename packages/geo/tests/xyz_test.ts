import { assertEquals } from "jsr:@std/assert";
import { XYZ } from "../src/xyz.ts";

Deno.test("Geo: XYZ to point", () => {
  const xyz = new XYZ(54726, 26765, 16);
  const point = [120.618896484375, 31.29263405889953];
  const mercator = [13427234.1366872, 3670811.8463673024];

  assertEquals(xyz.to_point(), point);
  assertEquals(xyz.to_crs84_point().toPoint(), point);
  assertEquals(xyz.to_crs84_point().toMercator(), mercator);
});
