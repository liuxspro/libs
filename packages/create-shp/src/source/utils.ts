import type { Point } from "@liuxspro/libs/geo";
import { get_digits } from "@liuxspro/libs/utils";

/**
 * 纠正投影坐标顺序
 * proj4 坐标顺序是[东坐标(加带号8位数) , 北坐标(7位)]
 *
 * 约定X为东坐标（横坐标，需加带号）
 *
 * 约定Y为北坐标（纵坐标，为恒为正的7位数）
 * @param {Point} point 点坐标
 * @returns points
 */
export function correct_points_order(point: Point): Point {
  const x = point[0];
  const y = point[1];
  let real_x;
  let real_y;
  if (get_digits(x) == 7) {
    // X 为7位数
    real_x = y;
    real_y = x;
  } else {
    real_x = x;
    real_y = y;
  }
  return [real_x, real_y];
}
