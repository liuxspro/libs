export * from "./math/index.ts";
export * from "./gis/esri_wkt.ts";
export * from "./gis/xyzmap.ts";
export * from "./filetype.ts";



/**
 * 创建 DBF 文件格式的字段值缓冲区
 * @param {string} value - 字段值字符串
 * @param {number} field_width - 字段固定宽度（字节）
 * @param {'left'|'right'} alignment - 对齐方式：
 *        'left': 左对齐（值在开头，空格在结尾） - DBF 文本字段常用
 *        'right': 右对齐（空格在开头，值在结尾） - DBF 数字字段常用
 * @returns {Uint8Array} 固定长度的二进制字段值
 * @throws 当值编码后超过字段宽度时
 */
export function create_dbf_field_value(
  value: string,
  field_width: number,
  alignment: "left" | "right" = "left",
): Uint8Array {
  const string_length = value.length;
  if (string_length > field_width) {
    throw new Error(`String length exceeds limit: ${field_width}`);
  }
  const encoder = new TextEncoder();
  const stringData = encoder.encode(value);

  // 创建主数组（全部初始化为0x20）
  const uint8Array = new Uint8Array(field_width).fill(0x20);

  if (alignment === "left") {
    // 左对齐：值在开头，空格在结尾
    uint8Array.set(stringData, 0);
  } else {
    // 右对齐：空格在开头，值在结尾
    uint8Array.set(stringData, field_width - string_length);
  }

  return uint8Array;
}
