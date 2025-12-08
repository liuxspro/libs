// import { assertEquals } from "jsr:@std/assert";
import { create_shp } from "../src/shp.ts";
import { MultiPolygon, Polygon, Ring } from "@liuxspro/libs/geo";

Deno.test("create_shp", async function () {
  const points = [
    [117.513070, 34.307738],
    [117.513274, 34.309178],
    [117.514937, 34.309049],
    [117.514722, 34.305380],
    [117.510045, 34.305752],
    [117.510372, 34.307986],
  ];
  const hole = [
    [117.511613226582298, 34.307186887974709],
    [117.511504859493698, 34.306493338607623],
    [117.514149016455704, 34.306233257594961],
    [117.514398260759506, 34.308292232278504],
    [117.513347100000018, 34.308346415822804],
    [117.513119529113936, 34.307132704430408],
    [117.511613226582298, 34.307186887974709],
  ];

  const side_points = [
    [117.515262, 34.309026],
    [117.516878, 34.308909],
    [117.516515, 34.305307],
    [117.515020, 34.305386],
  ];

  const ring = new Ring(points);
  const hole_ring = new Ring(hole);
  const polygon = new Polygon([ring, hole_ring]);
  const polygon_side = new Polygon([new Ring(side_points)]);
  const m = new MultiPolygon([polygon, polygon_side]);

  const shpfile = await create_shp(m, { DKMC: "DKMC" });
  Deno.writeFileSync(
    "./tests/data/test.shp",
    new Uint8Array(shpfile.shp.buffer),
  );
  Deno.writeFileSync(
    "./tests/data/test.shx",
    new Uint8Array(shpfile.shx.buffer),
  );
  Deno.writeFileSync(
    "./tests/data/test.dbf",
    new Uint8Array(shpfile.dbf.buffer),
  );
  Deno.writeTextFileSync("./tests/data/test.prj", shpfile.prj);
  Deno.writeTextFileSync("./tests/data/test.cpg", "UTF-8");
});
