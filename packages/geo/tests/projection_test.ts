import { assertEquals } from "jsr:@std/assert";
import { mercator_to_wgs84, wgs84_to_mercator } from "../src/projection.ts";

const points = [
  [
    [120, 30],
    [13358338.89519283, 3503549.84350438],
  ],
  [
    [47, 26],
    [5232016.06728386, 2999080.94347064],
  ],
  [
    [29.05644, -22.48146],
    [3234548.10506531, -2569429.28722740],
  ],
  [
    [-138.15829, 62.05977],
    [-15379710.49166942, 8873329.18203938],
  ],
];

Deno.test("wgs84_to_mercator", () => {
  points.forEach(([coordinate, expected]) => {
    const result = wgs84_to_mercator(coordinate as [number, number]);
    assertEquals(result[0].toFixed(6), expected[0].toFixed(6));
    assertEquals(result[1].toFixed(6), expected[1].toFixed(6));
  });
});

Deno.test("mercator_to_wgs84", () => {
  points.forEach(([expected, coordinate]) => {
    const result = mercator_to_wgs84(coordinate as [number, number]);
    assertEquals(result[0].toFixed(6), expected[0].toFixed(6));
    assertEquals(result[1].toFixed(6), expected[1].toFixed(6));
  });
});
