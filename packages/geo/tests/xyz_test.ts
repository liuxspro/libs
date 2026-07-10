import { assertEquals } from "jsr:@std/assert";
import { XYZ,CRS84XYZ } from "../src/xyz.ts";

Deno.test("Geo: XYZ to point", () => {
  const xyz = new XYZ(54726, 26765, 16);
  const point = [120.618896484375, 31.29263405889953];
  const mercator = [13427234.1366872, 3670811.8463673024];

  assertEquals(xyz.to_point(), point);
  assertEquals(xyz.to_crs84_point().toPoint(), point);
  assertEquals(xyz.to_crs84_point().toMercator(), mercator);
});

Deno.test("Geo: XYZ to quadkey", () => {
  const xyz = new XYZ(54726, 26765, 16);
  const quadkey = "1321210131002312";
  assertEquals(xyz.to_bing_quadkey(), quadkey);
});


Deno.test("Geo: CRS84XYZ to quadkey", () => {
  const xyz = new CRS84XYZ(211, 100, 8);
  assertEquals(xyz.to_ge_quadkey(), "012023022");
});
