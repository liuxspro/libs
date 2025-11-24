import { assertEquals, assertThrows } from "jsr:@std/assert";
import { get_zone } from "../../src/geo/cgcs.ts";
import { calc_signed_area } from "../../src/geo/area.ts";
import type { Point } from "../../src/geo/types.ts";

Deno.test("Geo: get_zone", () => {
  assertEquals(get_zone(74.59), 25);
  assertEquals(get_zone(73.65), 25);
  assertThrows(() => get_zone(73.6), Error, "经度不在中国范围内(73.62~135)");
  assertEquals(get_zone(135), 45);
  assertEquals(get_zone(76.53), 26);
  assertEquals(get_zone(117.19), 39);
});

Deno.test("Geo: calc_signed_area", () => {
  // 正方形，面积16
  const square = [[0, 0], [4, 0], [4, 4], [0, 4]];
  assertEquals(calc_signed_area(square as Point[]), 16);
  // 多边形，面积210.5
  const polygon = [[5, 0], [7, 10], [-2, 15], [-10, 2], [-5, -6], [5, 0]];
  assertEquals(calc_signed_area(polygon as Point[]), 210.5);
  assertEquals(calc_signed_area(polygon.reverse() as Point[]), -210.5);
});
