import type { Polygon } from "./polygon.ts";
import type { Point } from "../point.ts";

/**
 * 表示一个 多多边形 几何集合
 *
 * 多多边形是多个独立多边形的集合，用于表示包含多个不连续区域或包含多个岛屿的地理要素。
 * 每个多边形可以有自己的外环和内环（孔洞），多边形之间在几何上相互独立。
 * 通常用于表示地理信息系统中的复杂多边形要素。
 */
export class MultiPolygon {
  /**
   * 组成多多边形的多边形数组
   *
   * 每个多边形都是独立的几何要素，可以包含一个外环和零个或多个内环。
   * 多边形之间不应在几何上重叠（但可以相邻），这通常是数据一致性的要求。
   */
  polygons: Polygon[];
  /**
   * 创建一个多多边形实例
   *
   * @param polygons 组成多多边形的多边形数组。可以为空数组，表示一个空的多多边形。
   *
   * @example
   * ```typescript
   * // 创建一个包含两个分离矩形的多多边形
   * const poly1 = new Polygon([new Ring([[0, 0], [10, 0], [10, 10], [0, 10]])]);
   * const poly2 = new Polygon([new Ring([[20, 20], [30, 20], [30, 30], [20, 30]])]);
   * const multiPolygon = new MultiPolygon([poly1, poly2]);
   *
   * // 创建一个带孔洞的多边形组成的多多边形
   * const outerRing = new Ring([[0, 0], [100, 0], [100, 100], [0, 100]]);
   * const innerRing = new Ring([[20, 20], [80, 20], [80, 80], [20, 80]]);
   * const holePolygon = new Polygon([outerRing, innerRing]);
   * const multiWithHoles = new MultiPolygon([holePolygon]);
   * ```
   */
  constructor(polygons: Polygon[]) {
    this.polygons = [...polygons];
  }

  /**
   * 向多多边形添加一个多边形
   *
   * 用于动态构建多多边形集合，添加的多边形在几何上应与其他多边形独立。
   * 注意：添加多边形时不会检查多边形之间是否重叠，这是使用者的责任。
   *
   * @param polygon 要添加的多边形
   *
   * @example
   * ```typescript
   * const multiPolygon = new MultiPolygon([]);
   * const polygon = new Polygon([new Ring([[0, 0], [5, 0], [5, 5], [0, 5]])]);
   * multiPolygon.add_polygon(polygon);
   * ```
   */
  add_polygon(polygon: Polygon): void {
    this.polygons.push(polygon);
  }

  /**
   * 获取多多边形的坐标数组
   *
   * 返回一个四维数组，表示多多边形的完整几何结构：
   * - 第一维：多边形数组
   * - 第二维：每个多边形的环数组
   * - 第三维：每个环的点数组
   * - 第四维：每个点的[x, y]坐标
   *
   * 这个结构符合GeoJSON等标准格式中MultiPolygon的坐标表示。
   *
   * @returns 多多边形的坐标数组，格式为 `Point[][][]`
   *
   * @example
   * ```typescript
   * const poly1 = new Polygon([new Ring([[0, 0], [1, 0], [1, 1], [0, 1]])]);
   * const poly2 = new Polygon([new Ring([[2, 2], [3, 2], [3, 3], [2, 3]])]);
   * const multiPolygon = new MultiPolygon([poly1, poly2]);
   *
   * const coords = multiPolygon.coordinates;
   * // 结果: [
   * //   [ // 第一个多边形
   * //     [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
   * //   ],
   * //   [ // 第二个多边形
   * //     [[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]
   * //   ]
   * // ]
   * ```
   *
   * @readonly
   */
  get coordinates(): Point[][][] {
    return this.polygons.map((polygon) => polygon.coordinates);
  }
  /**
   * 对多多边形的所有点进行坐标转换
   *
   * @param transformFn 坐标转换函数，接收一个点并返回转换后的点
   * @returns 返回新的 MultiPolygon 实例
   */
  transform(
    transformFn: (point: Point) => Point,
  ): MultiPolygon {
    const transformedPolygons = this.polygons.map((polygon) =>
      polygon.transform(transformFn)
    );
    return new MultiPolygon(transformedPolygons);
  }

  /**
   * 计算多多边形的总面积
   *
   * 多多边形的总面积是其所有组成多边形面积的总和。
   * @returns 多多边形的总面积
   */
  get_area(): number {
    let totalArea = 0;
    for (const polygon of this.polygons) {
      totalArea += polygon.get_area();
    }
    return totalArea;
  }
  /**
   * 确保多多边形符合 GeoJSON 标准
   *
   * GeoJSON 标准要求外环为逆时针方向，内环为顺时针方向。
   * @returns {MultiPolygon} 符合 GeoJSON 标准的多多边形实例
   */
  ensure_geojson_standard(): MultiPolygon {
    const new_polygons = this.polygons.map((polygon) =>
      polygon.ensure_geojson_standard()
    );
    return new MultiPolygon(new_polygons);
  }

  /**
   * 确保多多边形符合 ESRI Shapefile 标准
   *
   * ESRI Shapefile 标准要求外环为顺时针方向，内环为逆时针方向。
   * @returns {MultiPolygon} 符合 ESRI 标准的多多边形实例
   */
  ensure_esri_standard(): MultiPolygon {
    const new_polygons = this.polygons.map((polygon) =>
      polygon.ensure_esri_standard()
    );
    return new MultiPolygon(new_polygons);
  }
}
