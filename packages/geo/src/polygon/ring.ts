import type { Point } from "../point.ts";
import { calc_signed_area } from "../point.ts";

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
}
