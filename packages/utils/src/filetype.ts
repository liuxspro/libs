import { array_is_equal } from "./array.ts";

/** 判断数据是否为 PNG 格式 */
export function is_png(data: Uint8Array): boolean {
  // https://zh.wikipedia.org/wiki/PNG
  // deno-fmt-ignore
  const magic_number = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return array_is_equal(data.slice(0, 8), magic_number);
}

/** 判断数据是否为 RIFF 格式 */
export function is_riff(data: Uint8Array): boolean {
  const header = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF
  return array_is_equal(data.slice(0, 4), header);
}

/** 判断数据是否为 WEBP 格式 */
export function is_webp(data: Uint8Array): boolean {
  if (!is_riff(data)) {
    return false;
  }
  const webpHeader = new Uint8Array([0x57, 0x45, 0x42, 0x50]); // "WEBP"
  return array_is_equal(data.slice(8, 12), webpHeader);
}
