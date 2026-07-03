import type { Point } from "./point.ts";
import { mercator_to_wgs84, wgs84_to_mercator } from "./mercator.ts";

/**
 * 表示地理坐标点的类，包含经度和纬度信息
 *
 * @example
 * const location = new CRS84Point(116.4074, 39.9042);
 */
export class CRS84Point {
  public longitude: number;
  public latitude: number;

  constructor(longitude: number, latitude: number) {
    this.longitude = longitude;
    this.latitude = latitude;
  }

  static fromPoint(point: Point): CRS84Point {
    return new CRS84Point(point[0], point[1]);
  }

  static fromMercator(point: Point): CRS84Point {
    const [longitude, latitude] = mercator_to_wgs84(point);
    return new CRS84Point(longitude, latitude);
  }

  toPoint(): Point {
    return [this.longitude, this.latitude];
  }

  toMercator(): Point {
    return wgs84_to_mercator(this.toPoint());
  }
}
