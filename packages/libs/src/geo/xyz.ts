import type { Point } from "./types.ts";
import { d2r, r2d } from "./utils.ts";

export class XYZ {
  /**
   * 构造函数，创建一个XYZ坐标点
   * @param x - X坐标（瓦片列索引）
   * @param y - Y坐标（瓦片行索引）
   * @param z - 缩放级别（zoom level）
   */
  constructor(public x: number, public y: number, public z: number) {}

  /**
   * 将XYZ瓦片坐标转换为地理经纬度坐标
   * @returns 返回包含经度和纬度的二元组 [longitude, latitude]（单位：度）
   *
   * @remarks
   * 转换公式: https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
   */
  to_lonlat(): Point {
    const n = Math.pow(2, this.z);
    const lon = (this.x / n) * 360 - 180;
    const lat = r2d(Math.atan(Math.sinh(Math.PI - (this.y / n) * 2 * Math.PI)));
    return [lon, lat];
  }

  /**
   * 从地理经纬度坐标生成对应的XYZ瓦片坐标
   * @param lon - 经度（单位：度）
   * @param lat - 纬度（单位：度）
   * @param z - 目标缩放级别
   * @returns 对应缩放级别的XYZ瓦片坐标对象
   * @remarks
   * 转换公式: https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
   */
  static from_lonlat(lon: number, lat: number, z: number): XYZ {
    const n = Math.pow(2, z);
    const x = Math.floor(((lon + 180) / 360) * n);
    const lat_rad = d2r(lat);
    const y = Math.floor(
      ((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) /
        2) *
        n,
    );
    return new XYZ(x, y, z);
  }
  /**
   * 从XYZ坐标生成对应的XYZ瓦片坐标对象
   * @param x - X坐标（瓦片列索引）
   * @param y - Y坐标（瓦片行索引）
   * @param z - 缩放级别（zoom level）
   * @returns 对应的XYZ瓦片坐标对象
   * @remarks
   * 该方法仅作为构造函数的别名，便于语义化调用。
   */
  static from_xyz(x: number, y: number, z: number): XYZ {
    return new XYZ(x, y, z);
  }
}
