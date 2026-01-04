import { calc_signed_area } from "./area.ts";

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, string | number>;
  geometry: MultiPolygonGeometry;
}

interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Point[][][];
}

/**
 * 表示地理坐标点的数据类型
 *
 * 定义为包含两个数字的元组类型：
 *   - 第一个元素为经度（longitude）
 *   - 第二个元素为纬度（latitude）
 *
 * @example
 * const location: Point = [116.4074, 39.9042];
 */
export type Point = number[] | [number, number];

/**
 * 环是点的数组
 * 环必须至少包含4个点（形成闭合图形）
 * 环会自动确保首尾点相同以形成闭合
 * @example
 * const ring = new Ring([[1,1], [1,2], [1,3], [1,1]]);
 */
export class Ring {
  /**
   * 组成环的点数组
   *
   * 每个点可以是 `[number, number]` 格式（推荐）或任意长度的 `number[]`，
   * 但只有前两个元素（x, y坐标）会被使用。点数组是原始点的浅拷贝。
   */
  points: Point[];
  /**
   * 创建一个环实例
   *
   * @param points 组成环的点数组
   *
   * @example
   * ```typescript
   * // 创建一个简单的矩形环
   * const ring = new Ring([
   *   [0, 0],  // 起点
   *   [10, 0],
   *   [10, 10],
   *   [0, 10],
   *   [0, 0]   // 终点（会自动闭合，可省略）
   * ]);
   * ```
   *
   * @throws {Error} 当点数小于等于 3 时抛出错误
   */
  constructor(points: Point[]) {
    // 创建浅拷贝，避免修改原数组
    this.points = [...points];
    this.ensure_closed();
    this.check_points_number();
  }

  /**
   * 检查点数是否满足最小要求
   *
   * 一个有效的环至少需要3个不同的点（形成闭合后至少4个点）
   *
   * @throws {Error} 点数不足时抛出错误
   */
  private check_points_number(): void {
    if (this.points.length <= 3) {
      throw new Error(
        `组成环的点数至少要 3 个, 当前只有 ${this.points.length} 个`,
      );
    }
  }
  /**
   * 确保环是闭合的
   *
   * 如果首尾点坐标不同，自动在末尾添加与起点相同的点
   */
  private ensure_closed() {
    const first_point = this.points[0];
    const last_point = this.points[this.points.length - 1];
    if (first_point[0] !== last_point[0] || first_point[1] !== last_point[1]) {
      this.points.push([first_point[0], first_point[1]]);
    }
  }

  /**
   * 对环的所有点进行坐标转换
   *
   * @param transformFn 坐标转换函数，接收一个点并返回转换后的点
   * @returns 返回新的 Ring 实例，包含转换后的点
   *
   * @example
   * ```typescript
   * const ring = new Ring([[0, 0], [10, 0], [10, 10], [0, 10]]);
   *
   * // 平移环
   * const translated = ring.transform(([x, y]) => [x + 5, y + 5]);
   *
   * // 缩放环
   * const scaled = ring.transform(([x, y]) => [x * 2, y * 2]);
   * ```
   */
  transform(
    transformFn: (point: Point) => Point,
  ): Ring {
    const transformedPoints = this.points.map(transformFn);
    return new Ring(transformedPoints);
  }

  /**
   * 计算环的有向面积
   *
   * 使用签名面积公式计算环的面积，面积符号表示环的方向：
   * - 正面积表示逆时针方向（外环）
   * - 负面积表示顺时针方向（内环）
   * @returns 环的有向面积
   */
  get_area(): number {
    return calc_signed_area(this.points);
  }
  /**
   * 判断环是否为外环(逆时针方向) GeoJSON标准
   *
   * 根据环的面积符号判断
   * @returns {boolean} 如果环为外环则返回 true，否则返回 false
   */
  is_outer(): boolean {
    return this.get_area() > 0;
  }

  /**
   * 判断环是否为顺时针方向
   * @returns {boolean} 如果环为**顺时针方向**则返回 true，否则返回 false
   */
  is_clockwise(): boolean {
    return this.get_area() < 0;
  }

  /**
   * 获取当前环的反向环
   * @returns 新的 Ring 实例，点顺序与当前环相反
   */
  to_reversed(): Ring {
    const reversed = this.points.slice().reverse();
    return new Ring(reversed);
  }

  /**
   * 确保环为外环（逆时针方向）GeoJSON标准
   *
   * 如果当前环为顺时针方向（内环），则反转点数组以确保为逆时针方向（外环）
   */
  ensure_outer(): Ring {
    if (!this.is_outer()) {
      return this.to_reversed();
    } else {
      return this;
    }
  }

  /**
   * 确保环为内环（顺时针方向）GeoJSON标准
   *
   * 如果当前环为逆时针方向（外环），则反转点数组以确保为顺时针方向（内环）
   */
  ensure_inner(): Ring {
    if (this.is_outer()) {
      return this.to_reversed();
    } else {
      return this;
    }
  }

  /**
   * 确保环为 ESRI Shapefile 标准的外环（顺时针方向）
   *
   * 如果当前环为逆时针方向（外环），则反转点数组以确保为顺时针方向（外环）
   * @returns {Ring} 确保为顺时针方向的环实例
   */
  ensure_esri_outer(): Ring {
    // 如果不是顺时针方向，则反转点数组
    if (!this.is_clockwise()) {
      return this.to_reversed();
    } else {
      return this;
    }
  }

  /**
   * 确保环为 ESRI Shapefile 标准的内环（逆时针方向）
   *
   * 如果当前环为顺时针方向（外环），则反转点数组以确保为逆时针方向（内环）
   * @returns {Ring} 确保为逆时针方向的环实例
   */
  ensure_esri_inner(): Ring {
    // 如果是逆时针方向，则反转点数组
    if (this.is_clockwise()) {
      return this.to_reversed();
    } else {
      return this;
    }
  }

  /**
   * 将环转换为多边形
   *
   * 一个多边形由一个外环和零个或多个内环组成，此方法创建只包含当前环的多边形
   *
   * @returns 包含当前环的新Polygon实例
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

  /**
   * 将环转换为多多边形
   *
   * 创建一个只包含当前环对应多边形的MultiPolygon实例
   *
   * @returns 包含当前环的新MultiPolygon实例
   *
   * @example
   * ```typescript
   * const ring = new Ring([[0, 0], [10, 0], [10, 10], [0, 10]]);
   * const multipolygon = ring.to_multipolygon();
   * ```
   */
  to_multipolygon(): MultiPolygon {
    return new MultiPolygon([this.to_polygon()]);
  }
}

/**
 * 表示一个地理多边形区域 Polygon
 *
 * 一个多边形由至少一个外环和零个或多个内环（孔洞）组成。外环定义多边形的边界，
 * 内环定义多边形内部的孔洞。外环需要顺时针方向，内环需要逆时针方向（按约定）。
 * 第一个环通常是外环，后续环是内环。
 */
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
   * 将多边形转换为多多边形
   *
   * 创建一个只包含当前多边形的 MultiPolygon 实例
   * @returns 包含当前多边形的新 MultiPolygon 实例
   */
  to_multipolygon(): MultiPolygon {
    return new MultiPolygon([this]);
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

  to_geojson(): GeoJSONFeatureCollection {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiPolygon",
            coordinates: this.coordinates,
          },
        },
      ],
    };
  }
}
