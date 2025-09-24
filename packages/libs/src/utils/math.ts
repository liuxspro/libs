/** 获取某个数字的整数部分位数 */
export function get_digits(n: number): number {
  const integerPart = Math.floor(Math.abs(n)); // 取绝对值并向下取整
  return integerPart.toString().length;
}

/** 生成[n,m]的随机整数 */
export function random(minNum: number, maxNum?: number): number {
  // 生成[n,m]的随机整数
  const by_min = Math.random() * minNum + 1;
  if (maxNum) {
    const by_min_and_max = Math.random() * (maxNum - minNum + 1) + minNum;
    return parseInt(by_min_and_max.toString(), 10);
  } else {
    return parseInt(by_min.toString(), 10);
  }
}

/**
 * 将数字四舍五入到指定精度
 *
 * from: https://github.com/sindresorhus/round-to/blob/main/index.js
 *
 * 该函数支持处理特殊数值（NaN/Infinity）、边界情况（-0）和浮点数精度问题，
 * 遵循传统的四舍五入规则（0.5向远离零的方向舍入）。
 *
 * @param number 要四舍五入的数字，允许特殊数值（NaN/Infinity）
 * @param precision 要保留的小数位数（必须为整数）
 *
 * @returns 四舍五入后的数字。特殊处理：
 *   - 非有限数（NaN/Infinity）直接返回原值
 *   - 精度为`Number.POSITIVE_INFINITY`时返回原值
 *   - 输入为`-0`时保留负零
 *   - 计算结果为`-0`时自动转为`0`
 *
 * @throws {TypeError} 当`number`不是数字类型时抛出
 * @throws {TypeError} 当`precision`不是整数时抛出
 *
 * @example
 * round_to(3.14159, 2);   // 3.14
 * round_to(1.005, 2);     // 1.01 (正确处理浮点精度)
 * round_to(-2.675, 2);    // -2.68
 * round_to(Infinity, 2);  // Infinity
 * round_to(-0, 5);        // -0
 */
export function round_to(number: number, precision: number): number {
  if (typeof number !== "number") {
    throw new TypeError("Expected value to be a number");
  }

  // Handle non-finite values explicitly
  if (!Number.isFinite(number)) {
    return number; // NaN, Infinity, -Infinity pass through unchanged
  }

  if (precision === Number.POSITIVE_INFINITY) {
    return number;
  }

  if (!Number.isInteger(precision)) {
    throw new TypeError("Expected precision to be an integer");
  }

  // If the input is already -0, preserve it
  if (Object.is(number, -0)) {
    return number;
  }

  const power = 10 ** precision;
  const scaledNumber = number * power;
  const scaledPrecise = Number.parseFloat(scaledNumber.toPrecision(15));

  // Traditional rounding - away from zero for 0.5
  const rounded = scaledPrecise < 0
    ? -Math.round(Math.abs(scaledPrecise))
    : Math.round(scaledPrecise);

  let result = rounded / power;

  // Ensure rounding operations never return -0, always return 0
  if (Object.is(result, -0)) {
    result = 0;
  }

  return result;
}
