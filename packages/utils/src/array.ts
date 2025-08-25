/**
 * 合并多个 Uint8Array 数组为一个 Uint8Array
 * @param {Uint8Array[]} arrays - 要合并的 Uint8Array 实例数组
 * @returns {Uint8Array} 合并后的 Uint8Array
 * @example
 * // 示例用法：
 * const arr1 = new Uint8Array([1, 2]);
 * const arr2 = new Uint8Array([3, 4]);
 * const merged = mergeUint8Arrays([arr1, arr2]);
 * console.log(merged); // 输出: Uint8Array [1, 2, 3, 4]
 */
export function mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  // 计算总长度
  const totalLength = arrays.reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  // 创建目标TypedArray
  const result = new Uint8Array(totalLength);
  let offset = 0;

  // 复制每个数组内容到结果数组
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}
