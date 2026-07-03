import { assertEquals } from "jsr:@std/assert";
import { toMercator, toWgs84 } from "npm:@turf/projection";
import { mercator_to_wgs84, wgs84_to_mercator } from "../src/mercator.ts";
import { CRS84Point } from "../src/crs84point.ts";

const wgs_points: [number, number][] = [
  [120, 30],
  [47, 26],
  [29.05644, -22.48146],
  [-138.15829, 62.05977],
  [120.618896484375, 31.29263405889953],
];

const mercator_points: [number, number][] = [
  [13358338.89519283, 3503549.84350438],
  [5232016.06728386, 2999080.94347064],
  [3234548.10506531, -2569429.28722740],
  [-15379710.49166942, 8873329.18203938],
  [13427234.13668720, 3670811.84636730],
];

Deno.test("Geo: wgs84_to_mercator", () => {
  wgs_points.forEach((point) => {
    const result = wgs84_to_mercator(point);
    const turf = toMercator(point);
    assertEquals(result[0].toFixed(6), turf[0].toFixed(6));
    assertEquals(result[1].toFixed(6), turf[1].toFixed(6));
    const crs84point = CRS84Point.fromPoint(point);
    const crs84result = crs84point.toMercator();
    assertEquals(crs84result[0].toFixed(6), result[0].toFixed(6));
    assertEquals(crs84result[1].toFixed(6), result[1].toFixed(6));
  });
});

Deno.test("Geo: mercator_to_wgs84", () => {
  mercator_points.forEach((point) => {
    const result = mercator_to_wgs84(point);
    const turf = toWgs84(point);
    assertEquals(result[0].toFixed(6), turf[0].toFixed(6));
    assertEquals(result[1].toFixed(6), turf[1].toFixed(6));
  });
});
