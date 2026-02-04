import { is_bit_set } from "./utils.ts";
export function xyz_to_quad(x: number, y: number, z: number) {
  // 缩放级别 0 的 quadkey 为空字符串
  if (z === 0) {
    return "";
  }
  let quadkey = "";
  for (let i = z; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if (is_bit_set(x, mask)) digit += 1;
    if (is_bit_set(y, mask)) digit += 2;
    quadkey += digit;
  }
  return quadkey;
}
