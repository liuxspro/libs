/**
 * 将角度转换为弧度。
 * @param degree 角度值
 * @returns 弧度值
 */
export function degree_to_radius(degree: number): number {
  return (degree * Math.PI) / 180;
}

/**
 * 将弧度转换为角度。
 * @param radius 弧度值
 * @returns 角度值
 */
export function radius_to_degree(radius: number): number {
  return (radius * 180) / Math.PI;
}

/**
 *  将角度转换为弧度的别名函数。
 */
export const d2r = degree_to_radius;

/**
 *  将弧度转换为角度的别名函数。
 */
export const r2d = radius_to_degree;
