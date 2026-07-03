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
 * 表示带有高度信息的地理坐标点的数据类型
 *
 * 定义为包含三个数字的元组类型：
 *   - 第一个元素为经度（longitude）
 *   - 第二个元素为纬度（latitude）
 *   - 第三个元素为高度（height）
 *
 * @example
 * const location: PointZ = [116.4074, 39.9042, 10];
 */
export type PointZ = [number, number, number];
