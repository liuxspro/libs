import type { Point } from "@liuxspro/libs/geo";
import { get_digits } from "@liuxspro/libs/utils";

/**
 * 返回带号对应的 ESRI WKT
 * @param zone 3度带带号，25~45
 * @returns ESRI WKT
 *
 * https://epsg.io/4527
 */
export function get_cgcs2000_wkt(zone: number): string {
  if (zone < 25 || zone > 45) {
    throw new Error("带号不在范围内(25~45)");
  }
  const PROJCS_name = `CGCS2000_3_Degree_GK_Zone_${zone}`;
  const GEOGCS_name = "GCS_China_Geodetic_Coordinate_System_2000";
  const GEOGCS =
    `GEOGCS["${GEOGCS_name}",DATUM["D_China_2000",SPHEROID["CGCS2000",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;
  const East = zone * 1000000 + 500000;
  const cm = 75 + (zone - 25) * 3; // Central_Meridian
  const PROJECTION =
    `PROJECTION["Gauss_Kruger"],PARAMETER["False_Easting",${East}.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${cm}.0],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]`;
  return `PROJCS["${PROJCS_name}",${GEOGCS},${PROJECTION}]`;
}

/**
 * 根据经度获取带号(3度带)
 * @param longitude 经度
 * @returns 3度带带号(25~45)
 * @throws {Error} 如果经度不在中国范围内(73.62~135)则抛出错误
 */
export function get_zone(longitude: number): number {
  if (longitude < 73.62 || longitude > 135) {
    throw new Error("经度不在中国范围内(73.62~135)");
  }
  return Math.round(longitude / 3);
}

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
    // X 为7位数，X和Y互换位置
    real_x = y;
    real_y = x;
  } else {
    real_x = x;
    real_y = y;
  }
  if (get_digits(real_x) != 8) {
    throw new Error("X 缺失带号");
  }
  return [real_x, real_y];
}
