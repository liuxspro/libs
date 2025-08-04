import { assertEquals } from "jsr:@std/assert";
import { toMercator, toWgs84 } from "npm:@turf/projection";
import { mercator_to_wgs84, wgs84_to_mercator } from "../src/projection.ts";

const wgs_points: [number, number][] = [
  [120, 30],
  [47, 26],
  [29.05644, -22.48146],
  [-138.15829, 62.05977],
];

const mercator_points: [number, number][] = [
  [13358338.89519283, 3503549.84350438],
  [5232016.06728386, 2999080.94347064],
  [3234548.10506531, -2569429.28722740],
  [-15379710.49166942, 8873329.18203938],
];

Deno.test("wgs84_to_mercator", () => {
  wgs_points.forEach((point) => {
    const result = wgs84_to_mercator(point);
    const turf = toMercator(point);
    assertEquals(result[0].toFixed(6), turf[0].toFixed(6));
    assertEquals(result[1].toFixed(6), turf[1].toFixed(6));
  });
});

Deno.test("mercator_to_wgs84", () => {
  mercator_points.forEach((point) => {
    const result = mercator_to_wgs84(point);
    const turf = toWgs84(point);
    assertEquals(result[0].toFixed(6), turf[0].toFixed(6));
    assertEquals(result[1].toFixed(6), turf[1].toFixed(6));
  });
});
