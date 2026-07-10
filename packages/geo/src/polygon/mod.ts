import { Ring as BaseRingClass } from "./ring.ts";
import { Polygon as PolygonClass } from "./polygon.ts";
import { MultiPolygon } from "./multi_polygon.ts";

export class Ring extends BaseRingClass {
  /**
   * 将环转换为多边形
   *
   * 一个多边形由一个外环和零个或多个内环组成，此方法创建只包含当前环的多边形
   *
   * @returns 包含当前环的新 Polygon 实例
   *
   * @example
   * ```typescript
   * const ring = new Ring([[0, 0], [10, 0], [10, 10], [0, 10]]);
   * const polygon = ring.to_polygon();
   * ```
   */
  to_polygon(): Polygon {
    return new Polygon([this]);
  }
}

export class Polygon extends PolygonClass {
  /**
   * 将多边形转换为多多边形
   *
   * 创建一个只包含当前多边形的 MultiPolygon 实例
   * @returns 包含当前多边形的新 MultiPolygon 实例
   */
  to_multipolygon(): MultiPolygon {
    return new MultiPolygon([this]);
  }
}

export { MultiPolygon };
