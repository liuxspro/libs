import { date_to_str, encode_text } from "./utils.ts";
import type { Field } from "./field.ts";
import { mergeUint8Arrays } from "@liuxspro/utils/array";

/**
 * 一条记录，由不同字段类型值组成的数组
 */
type RecordValue = (string | number | boolean | Date)[];

/**
 * Record deleted flag
 * `0x20`:有效, `0x2A`:删除
 */
const RECORD_FLAG = Uint8Array.of(0x20);

export function get_value_info(value: string | number | boolean | Date) {
  if (typeof value == "boolean") {
    return { type: "L", value: value ? "T" : "F" };
  }
  if (typeof value == "string") {
    return { type: "C", value };
  }
  if (typeof value == "number") {
    return { type: "N", value: value.toString() };
  }
  if (value instanceof Date) {
    return { type: "D", value: date_to_str(value) };
  }
  return { type: "C", value: "*" };
}

/**
 * 创建 DBF 字段值数据
 * @param {string} value - 字段值的字符串表示
 * @param {number} length - 字段长度
 * @param {'left'|'right'} alignment - 对齐方式：
 *        'left': 左对齐（值在开头，空格在结尾）  - DBF 文本字段常用
 *        'right': 右对齐（空格在开头，值在结尾） - DBF 数字字段常用
 * @returns {Uint8Array} 字段值
 * @throws 当字段值编码后超过字段宽度时
 */
export function create_record_data(
  value: string,
  length: number,
  alignment: "left" | "right" = "left",
): Uint8Array {
  const string_length = value.length;
  if (string_length > length) {
    throw new Error(`String length exceeds limit: ${length}`);
  }

  const stringData = encode_text(value);

  // 创建主数组（全部初始化为0x20）
  const uint8Array = new Uint8Array(length).fill(0x20);

  if (alignment === "left") {
    // 左对齐：值在开头，空格在结尾
    uint8Array.set(stringData, 0);
  } else {
    // 右对齐：空格在开头，值在结尾
    uint8Array.set(stringData, length - string_length);
  }

  return uint8Array;
}

export function record_to_uint8array(fields: Field[], record: RecordValue) {
  if (fields.length !== record.length) {
    throw new Error("记录所包含的值数量与字段定义不同");
  }
  const data_array = record.map((value, index) => {
    const field = fields[index];
    const value_info = get_value_info(value);
    if (field.type != value_info.type) {
      throw new Error("记录类型与字段定义不符合");
    }
    if (value_info.type == "N") {
      if ((field.precision as number) == 0) {
        return create_record_data(
          parseInt((value as number).toString()).toString(),
          field.length as number,
          "right",
        );
      }
      if ((field.precision as number) > 0) {
        const number_value = (value as number).toFixed(field.precision);
        return create_record_data(
          number_value,
          field.length as number,
          "right",
        );
      }
    }
    return create_record_data(value_info.value, field.length as number);
  });

  return mergeUint8Arrays([RECORD_FLAG, ...data_array]);
}
