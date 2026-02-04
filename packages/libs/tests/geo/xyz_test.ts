import { assertEquals } from "jsr:@std/assert";
import { XYZ } from "../../src/geo/xyz.ts";

Deno.test("Geo: Class XYZ", () => {
  const x = 211;
  const y = 100;
  const z = 8;
  const xyz = new XYZ(x, y, z);
  const lonlat: [number, number] = [116.71875, 36.5978891330702];
  assertEquals(xyz.to_lonlat(), lonlat);
  assertEquals(XYZ.from_lonlat(...lonlat, z), xyz);
  assertEquals(xyz.to_bing_quadkey(), "13210211");
  assertEquals(xyz.to_ge_quadkey(), "012023022");
  assertEquals(new XYZ(2, 2, 2).to_bing_quadkey(), "30");

  const xyz2 = XYZ.from_xyz(469, 171, 9);
  const lonlat2: [number, number] = [150.170857, 50.949096];
  assertEquals(xyz2.to_lonlat(), [149.765625, 51.17934297928927]);
  assertEquals(XYZ.from_lonlat(...lonlat2, 9), xyz2);
});
