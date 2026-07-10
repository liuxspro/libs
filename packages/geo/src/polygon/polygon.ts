import type { Ring } from "./ring.ts";
import type { Point } from "../point.ts";

export class Polygon {
  /**
   * 组成多边形的环数组
   *
   * 数组的第一个元素是外环（定义多边形边界），后续元素是内环（定义多边形内部的孔洞）。
   * 内环必须在几何上完全位于外环内部，且内环之间不能相交。
   */
  rings: Ring[];
  /**
   * 创建一个多边形实例
   *
   * @param rings 组成多边形的环数组。至少需要一个外环，可以有零个或多个内环。
   *
   * @example
   * ```typescript
   * // 创建一个包含外环和内环的多边形（带孔洞的矩形）
   * const outerRing = new Ring([[0, 0], [100, 0], [100, 100], [0, 100]]);
   * const innerRing = new Ring([[20, 20], [80, 20], [80, 80], [20, 80]]);
   * const polygon = new Polygon([outerRing, innerRing]);
   *
   * // 创建一个简单多边形（无孔洞）
   * const simplePolygon = new Polygon([new Ring([[0, 0], [50, 0], [50, 50], [0, 50]])]);
   * ```
   */
  constructor(rings: Ring[]) {
    this.rings = [...rings];
  }

  /**
   * 向多边形添加一个环
   *
   * 通常用于添加内环（孔洞），但也可以添加外环（如果多边形是空的）。
   * 注意：调用此方法后，需要确保多边形的几何有效性（如环的方向、环之间的关系）。
   *
   * @param ring 要添加的环
   *
   * @example
   * ```typescript
   * const polygon = new Polygon([outerRing]);
   * polygon.add_ring(innerRing); // 添加一个孔洞
   * ```
   */
  add_ring(ring: Ring): void {
    this.rings.push(ring);
  }

  /**
   * 获取多边形的坐标数组
   *
   * 返回一个三维数组，表示多边形的几何结构：
   * - 第一维：环的数组
   * - 第二维：每个环的点数组
   * - 第三维：每个点的[x, y]坐标
   *
   * @returns 多边形的坐标数组，格式为 `Point[][]`
   *
   * @example
   * ```typescript
   * const polygon = new Polygon([new Ring([[0, 0], [10, 0], [10, 10], [0, 10]])]);
   * const coords = polygon.coordinates;
   * // 结果: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
   * ```
   *
   * @readonly
   */
  get coordinates(): Point[][] {
    return this.rings.map((ring) => ring.points);
  }

  /**
   * 对多边形的所有点进行坐标转换
   *
   * @param transformFn 坐标转换函数，接收一个点并返回转换后的点
   * @returns 返回新的 Polygon 实例
   */
  transform(
    transformFn: (point: Point) => Point,
  ): Polygon {
    const transformedRings = this.rings.map((ring) =>
      ring.transform(transformFn)
    );
    return new Polygon(transformedRings);
  }

  /**
   * 计算多边形的总面积
   *
   * 多边形的总面积等于外环面积减去所有内环面积之和。
   * @returns 多边形的总面积
   */
  get_area(): number {
    let totalArea = 0;
    if (this.rings.length === 0) {
      return 0;
    }
    for (const ring of this.rings) {
      totalArea += ring.get_area();
    }
    return totalArea;
  }

  /**
   * 确保多边形符合 GeoJSON 标准
   *
   * GeoJSON 标准要求外环为逆时针方向，内环为顺时针方向。
   * @returns
   */
  ensure_geojson_standard(): Polygon {
    const length = this.rings.length;
    if (length === 1) {
      const ring = this.rings[0];
      return new Polygon([ring.ensure_outer()]);
    } else {
      const first_ring = this.rings[0];
      const new_first_ring = first_ring.ensure_outer();
      const other_rings = this.rings.slice(1).map((ring) =>
        ring.ensure_inner()
      );
      return new Polygon([new_first_ring, ...other_rings]);
    }
  }

  /**
   * 确保多边形符合 ESRI Shapefile 标准
   *
   * ESRI Shapefile 标准要求外环为顺时针方向，内环为逆时针方向。
   * @returns
   */
  ensure_esri_standard(): Polygon {
    const length = this.rings.length;
    if (length === 1) {
      const ring = this.rings[0];
      return new Polygon([ring.ensure_esri_outer()]);
    } else {
      const first_ring = this.rings[0];
      const new_first_ring = first_ring.ensure_esri_outer();
      const other_rings = this.rings.slice(1).map((ring) =>
        ring.ensure_esri_inner()
      );
      return new Polygon([new_first_ring, ...other_rings]);
    }
  }
}
