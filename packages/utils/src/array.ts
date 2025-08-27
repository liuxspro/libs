/**
 * 合并多个 Uint8Array 数组为一个 Uint8Array
 * @param {Uint8Array[]} arrays - 要合并的 Uint8Array 实例数组
 * @returns {Uint8Array} 合并后的 Uint8Array
 * @example
 * ```typescript
 * const arr1 = new Uint8Array([1, 2]);
 * const arr2 = new Uint8Array([3, 4]);
 * const merged = mergeUint8Arrays([arr1, arr2]);
 * console.log(merged); // 输出: Uint8Array [1, 2, 3, 4]
 * ```
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

/**
 * 比较两个 Uint8Array 数组是否完全相等
 *
 * @param a - 第一个要比较的 Uint8Array 数组
 * @param b - 第二个要比较的 Uint8Array 数组
 * @returns 如果两个数组长度相同且所有对应位置的元素都相等则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * const arr1 = new Uint8Array([1, 2, 3]);
 * const arr2 = new Uint8Array([1, 2, 3]);
 * const arr3 = new Uint8Array([1, 2, 4]);
 *
 * array_is_equal(arr1, arr2); // true
 * array_is_equal(arr1, arr3); // false
 * ```
 *
 * @remarks
 * 此函数专门用于比较 Uint8Array 类型，对于其他类型的数组可能需要不同的实现
 */
export function array_is_equal(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
