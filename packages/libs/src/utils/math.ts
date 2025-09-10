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
