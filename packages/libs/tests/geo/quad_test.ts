import { assertEquals } from "jsr:@std/assert";
import {
  quad_to_xyz,
  xyz_to_quad,
} from "../../src/geo/quad/googleEarthQuad.ts";
import { xyz_to_quad as xyz_to_bingQuad } from "../../src/geo/quad/BingQuad.ts";

Deno.test("Geo: Google Eatrh Quadkey", () => {
  const x = 211;
  const y = 100;
  const z = 8;
  assertEquals(xyz_to_quad(x, y, z), "012023022");
  assertEquals(quad_to_xyz("012023022"), { x, y, level: z });
  assertEquals(quad_to_xyz("030"), { x: 0, y: 0, level: 2 });
  assertEquals(xyz_to_bingQuad(x, y, z), "13210211");
});
