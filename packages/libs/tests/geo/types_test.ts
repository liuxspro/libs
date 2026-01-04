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
  const ring5 = new Ring([[1, 1], [1, 4], [5, 4], [5, 1]]); // 顺时针,面积为负 -12
  const ring6 = new Ring([[5, 0], [7, 10], [-2, 15], [-10, 2], [-5, -6]]); // 逆时针,面积为正 210.5
  assertEquals(ring5.get_area(), -12);
  assertEquals(ring5.is_outer(), false); // 是否为外环，否
  assertEquals(ring5.ensure_outer().is_outer(), true); // 强制为外环
  assertEquals(ring5.ensure_outer().get_area(), 12);
  assertEquals(ring6.get_area(), 210.5);
  assertEquals(ring6.is_outer(), true);
  assertEquals(ring6.ensure_outer().get_area(), 210.5);

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
  const polygon2 = new Polygon([ring5.ensure_outer(), ring6]);
  assertEquals(polygon2.get_area(), 222.5);
  assertEquals(polygon2.to_multipolygon().get_area(), 222.5);

  const mpolygon = new MultiPolygon([polygon, new Polygon([ring4])]);
  // console.log(JSON.stringify(ring4.to_multipolygon().to_geojson()));
  const trans_polygon = polygon.transform(t);
  const trans_mpolygon = mpolygon.transform(t);
  assertEquals(trans_polygon.rings[0].points[0][0], 11);
  assertEquals(trans_mpolygon.coordinates[0][0][0][0], 11);
  assertEquals(mpolygon.polygons.length, 2);
  assertEquals(polygon.coordinates[0], ring.points);
});

Deno.test("Geo: Polygon 环方向检查", () => {
  // 按顺时针排列的环
  const ring_clockwise = [
    [39547228.491, 3797916.479],
    [39547246.449, 3798076.324],
    [39547399.598, 3798062.844],
    [39547381.907, 3797655.744],
    [39546951.091, 3797694.864],
    [39546979.97, 3797942.755],
    [39547228.491, 3797916.479],
  ];
  const ring_counterclockwise = ring_clockwise.toReversed();
  // 孔洞 逆时针排列
  const hole_counterclockwise_points = [
    [39547163.999907895922661, 3797857.179684211034328],
    [39547156.805776312947273, 3797784.684973684605211],
    [39547264.717749997973442, 3797777.490842105820775],
    [39547270.805092103779316, 3797848.878763158340007],
    [39547163.999907895922661, 3797857.179684211034328],
  ];
  const ring1 = new Ring(ring_clockwise); // 顺时针环
  const ring2 = new Ring(ring_counterclockwise); // 逆时针环
  const hole_counterclockwise = new Ring(hole_counterclockwise_points); // 逆时针孔洞
  const hole_clockwise = new Ring(hole_counterclockwise_points.toReversed()); // 顺时针孔洞
  const m1 = new Polygon([ring1, hole_counterclockwise]); // 顺时针环 + 逆时针空洞 (ESRI 标准)
  const m2 = new Polygon([ring2, hole_clockwise]); // 逆时针环 + 顺时针空洞 (Geojson 标准)
  assertEquals(m1, m2.ensure_esri_standard());
  assertEquals(m1.ensure_geojson_standard(), m2);
});
