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
export type Point = [number, number];

/**
 * 环是点的数组
 * 环必须至少包含4个点（形成闭合图形）
 *
 * @example
 * const ring: Ring = [[1,1], [1,2], [1,3], [1,1]];
 */
// export type Ring = Point[];

/**
 * 多边形
 * 一个Polygon的坐标是一个环的数组，
 * 其中第一个环是外环(必须存在，坐标点按逆时针排列)
 * 后续的环是内环（孔洞，可选，坐标点按顺时针排列）
 *
 * @example
 * // 有效的多边形示例
 * ```javascript
 * const simplePolygon: Polygon = [
 *  [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]] // 外环
 * ];
 *
 * const polygonWithHole: Polygon = [
 *  [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], // 外环
 *  [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]]      // 内环（孔洞）
 * ];
 */
export type Polygon = Ring[];

/**
 * 多多边形
 * 多边形数组，

 * @example
 * ```javascript
 * const multi_polygon: MultiPolygon = [
 *    [[[0, 0], [1, 0], [1, 1], [0, 0]]], // 第一个多边形 Ploygon
 * ];
 */
export type MultiPolygon = Polygon[];

export class Ring {
  points: Point[];
  constructor(points: Point[]) {
    // 创建浅拷贝，避免修改原数组
    this.points = [...points];
    this.ensure_closed();
    this.check_points_number();
  }

  private check_points_number(): void {
    if (this.points.length <= 3) {
      throw new Error(
        `组成环的点数至少要 3 个, 当前只有 ${this.points.length} 个`,
      );
    }
  }

  private ensure_closed() {
    const first_point = this.points[0];
    const last_point = this.points[this.points.length - 1];
    if (first_point[0] !== last_point[0] || first_point[1] !== last_point[1]) {
      this.points.push([first_point[0], first_point[1]]);
    }
  }

  /**
   * 对环的所有点进行坐标转换
   * @param transformFn 坐标转换函数，接收一个点并返回转换后的点
   * @returns 返回新的Ring实例，包含转换后的点
   */
  transform<T extends [number, number]>(
    transformFn: (point: Point) => T,
  ): Ring {
    const transformedPoints = this.points.map(transformFn);
    return new Ring(transformedPoints);
  }
}
