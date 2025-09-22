import type { point } from "./types.ts";

/**
 * 使用鞋带公式（有向面积法）计算多边形面积
 * https://en.wikipedia.org/wiki/Shoelace_formula
 *
 * 该函数通过遍历多边形顶点坐标，应用鞋带公式计算有向面积。
 * 返回值的符号表示顶点排列顺序：正值表示**逆时针**顺序，负值表示**顺时针**顺序。
 *
 * @param points - 多边形顶点坐标数组，每个顶点为包含两个数字的元组 [x, y]
 * @returns 多边形的有向面积 正值表示**逆时针**顺序，负值表示**顺时针**顺序
 *
 * @example
 * ```typescript
 * // 计算三角形面积
 * const triangle = [[0,0], [4,0], [0,3]];
 * calc_signed_area(triangle); // 返回 6
 *
 * // 计算矩形面积
 * const rectangle = [[1,1], [1,4], [5,4], [5,1]];
 * calc_signed_area(rectangle); // 返回 12
 * ```
 */
export function calc_signed_area(points: point[]): number {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    area += xi * yj - xj * yi;
  }
  return area / 2;
}
