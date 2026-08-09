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

/**
 * 检查指定的位是否被设置。
 * @param bits 位值
 * @param mask 位掩码
 * @returns 如果位被设置则返回 true，否则返回 false
 */
export function is_bit_set(bits: number, mask: number) {
  return (bits & mask) !== 0;
}

/**
 * 将缩放级别转换为比例尺。
 * @param zoom 缩放级别
 * @param dpi 分辨率（可选）默认为OGC标准，可选96
 * @returns 比例尺
 */
export function zoom_to_scale(zoom: number, dpi?: number): number {
  let pixel_width = 0.00028;
  if (dpi == 96) {
    pixel_width = 0.0254 / 96;
  }
  return (256 * Math.pow(2, zoom) * pixel_width) / (2 * Math.PI * 6378137);
}

/**
 * 将缩放级别转换为比例尺分母。
 * @param zoom 缩放级别
 * @param dpi 分辨率（可选）默认为OGC标准，可选 96
 * @returns 比例尺分母
 */
export function zoom_to_scale_denominator(zoom: number, dpi?: number): number {
  let pixel_width = 0.00028;
  if (dpi == 96) {
    pixel_width = 0.0254 / 96;
  }
  return (2 * Math.PI * 6378137) / (256 * Math.pow(2, zoom) * pixel_width);
}

/**
 * 将缩放级别转换为分辨率(米/像素)[墨卡托坐标系]。
 * @param zoom 缩放级别
 * @returns 分辨率(米/像素)
 */
export function zoom_to_resolution(zoom: number): number {
  return (2 * Math.PI * 6378137) / (256 * Math.pow(2, zoom));
}
