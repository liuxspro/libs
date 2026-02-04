import type { Point } from "./types.ts";
import { d2r, r2d } from "./utils.ts";
import { xyz_to_quad as to_bing_quad } from "./quad/BingQuad.ts";
import { xyz_to_quad as to_ge_quad } from "./quad/googleEarthQuad.ts";

class BaseXYZ {
  /**
   * 构造函数，创建一个XYZ坐标点
   * @param x - X坐标（瓦片列索引）
   * @param y - Y坐标（瓦片行索引）
   * @param z - 缩放级别（zoom level）
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  /**
   * 从 XYZ 坐标生成对应的 XYZ 瓦片坐标对象
   * @param x - X坐标（瓦片列索引）
   * @param y - Y坐标（瓦片行索引）
   * @param z - 缩放级别（zoom level）
   * @returns 对应的XYZ瓦片坐标对象
   * @remarks
   * 该方法仅作为构造函数的别名，便于语义化调用。
   */
  static from_xyz(x: number, y: number, z: number): BaseXYZ {
    return new BaseXYZ(x, y, z);
  }
}

export class XYZ extends BaseXYZ {
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
   * 将 XYZ 瓦片坐标转换为 Bing Quadkey
   * @returns {string} Bing Quadkey
   */
  to_bing_quadkey(): string {
    return to_bing_quad(this.x, this.y, this.z);
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

  static override from_xyz(x: number, y: number, z: number): XYZ {
    return new XYZ(x, y, z);
  }
}

export class CRS84XYZ extends BaseXYZ {
  /**
   * 将CRS84的XYZ瓦片坐标转换为地理经纬度坐标(瓦片中心)
   * @returns 返回瓦片中心点坐标 [lon,lat]
   */
  to_lonlat(): Point {
    const lon = (this.x * 360) / Math.pow(2, this.z) - 180;
    // 计算瓦片中心点坐标
    const d_lon = 360 / Math.pow(2, this.z);
    const lat = 90 - (this.y * 180) / Math.pow(2, this.z - 1);
    const d_lat = 180 / Math.pow(2, this.z - 1);
    return [lon + d_lon / 2, lat - d_lat / 2];
  }

  /**
   * 将 XYZ 瓦片坐标转换为 Google Earth Quadkey
   * @returns {string} Google Earth Quadkey
   */
  to_ge_quadkey(): string {
    return to_ge_quad(this.x, this.y, this.z);
  }

  /**
   * 从经纬度坐标生成对应的 CRS84 瓦片坐标
   * @param lon - 经度（单位：度）
   * @param lat - 纬度（单位：度）
   * @param z - 目标缩放级别
   * @returns 对应缩放级别的 CRS84 瓦片坐标对象
   */
  static from_lonlat(lon: number, lat: number, z: number): CRS84XYZ {
    // 计算瓦片总数
    const tilesCount = Math.pow(2, z);

    // 计算经度对应的x坐标
    // 经度范围从-180到180，转换为0到tilesCount
    const normalizedLon = (lon + 180) / 360;
    const x = Math.floor(normalizedLon * tilesCount);

    // 计算纬度对应的y坐标
    // 纬度范围从-90到90，转换为0到tilesCount/2
    const normalizedLat = (90 - lat) / 180;
    const y = Math.floor(normalizedLat * (tilesCount / 2));

    return new CRS84XYZ(x, y, z);
  }

  static override from_xyz(x: number, y: number, z: number): CRS84XYZ {
    return new CRS84XYZ(x, y, z);
  }
}
