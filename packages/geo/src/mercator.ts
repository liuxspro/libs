import type { Point } from "./point.ts";
import { d2r, r2d } from "./utils.ts";

/**
 * 将WGS84坐标（经纬度）转换为墨卡托投影坐标。
 * @param coordinate [经度, 纬度]
 * @returns [x, y] 墨卡托投影坐标
 */
export function wgs84_to_mercator(coordinate: Point): Point {
  // https://en.wikipedia.org/wiki/Mercator_projection
  const [longitude, latitude] = coordinate;
  const R = 6378137;
  const x = R * d2r(longitude);
  const y = R * Math.log(Math.tan(Math.PI / 4 + d2r(latitude) / 2));
  return [x, y];
}

/**
 * 将墨卡托投影坐标转换为WGS84坐标（经纬度）。
 * @param coordinate [x, y] 墨卡托投影坐标
 * @returns [经度, 纬度] WGS84坐标
 */
export function mercator_to_wgs84(coordinate: Point): Point {
  // https://en.wikipedia.org/wiki/Mercator_projection
  const [x, y] = coordinate;
  const R = 6378137;
  const longitude = r2d(x / R);
  const latitude = r2d(2 * Math.atan(Math.exp(y / R)) - Math.PI / 2);
  return [longitude, latitude];
}
