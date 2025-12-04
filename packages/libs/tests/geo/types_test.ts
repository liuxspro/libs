import { assertEquals } from "jsr:@std/assert";

import {
  type MultiPolygon,
  type Point,
  type Polygon,
  Ring,
} from "../../src/geo/types.ts";

Deno.test("Geo: types", () => {
  const p1: Point = [1, 1];
  const p2: Point = [1, 2];
  const p3 = [1, 3];
  // 检查是否闭合
  const ring = new Ring([p1, p2, p3 as Point]);
  assertEquals(ring.points[0], ring.points.at(-1));
  const ring2 = new Ring([p1, p2, p3 as Point, p1]);
  assertEquals(ring2.points[0], ring2.points.at(-1));
  const ring3 = new Ring([[0, 0], [1, 1], [0, 2], [0, 0]]);
  assertEquals(ring3.points.length, 4);
  const polygon: Polygon = [ring];
  const mpolygon: MultiPolygon = [polygon];
  assertEquals(polygon[0], ring);
  assertEquals(polygon[0].points[0], p1);
  assertEquals(mpolygon[0], polygon);
  const originalRing = new Ring([[0, 0], [1, 0], [0, 1]]);
  const t = function ([x, y]: [number, number]): [number, number] {
    return [x + 10, y + 5];
  };
  const translatedRing = originalRing.transform(t);
  assertEquals(translatedRing.points[0][0], 10);
});
