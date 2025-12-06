import { assertEquals } from "jsr:@std/assert";

import {
  MultiPolygon,
  type Point,
  Polygon,
  Ring,
} from "../../src/geo/types.ts";

Deno.test("Geo: types", () => {
  const p1: Point = [1, 1];
  const p2: Point = [1, 2];
  const p3 = [1, 3];
  const points = [
    [117.513070, 34.307738],
    [117.513274, 34.309178],
    [117.514937, 34.309049],
    [117.514722, 34.305380],
    [117.510045, 34.305752],
    [117.510372, 34.307986],
  ];

  const ring = new Ring([p1, p2, p3]);
  const ring2 = new Ring([p1, p2, p3 as Point, p1]);
  const ring3 = new Ring([[0, 0], [1, 1], [0, 2], [0, 0]]);
  const ring4 = new Ring(points);

  const t = function ([x, y]: Point): Point {
    return [x + 10, y + 5];
  };
  const trans_ring = ring.transform(t);
  assertEquals(ring, ring2);
  assertEquals(ring.points[0], ring.points.at(-1));
  assertEquals(ring2.points[0], ring2.points.at(-1));
  assertEquals(ring3.points.length, 4);
  assertEquals(trans_ring.points[0][0], 11);

  const polygon = new Polygon([ring]);

  const mpolygon = new MultiPolygon([polygon, new Polygon([ring4])]);
  const trans_polygon = polygon.transform(t);
  const trans_mpolygon = mpolygon.transform(t);
  assertEquals(trans_polygon.rings[0].points[0][0], 11);
  assertEquals(trans_mpolygon.coordinates[0][0][0][0], 11);
  assertEquals(mpolygon.polygons.length, 2);
  assertEquals(polygon.coordinates[0], ring.points);
});
