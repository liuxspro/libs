import type { Field } from "./field.ts";
import { get_update_date } from "./utils.ts";
import { record_to_uint8array } from "./record.ts";
import { mergeUint8Arrays } from "jsr:@liuxspro/utils@0.1.12/array";

type RecordValue = (string | number | boolean | Date)[];
const DBF_FILE_VERSION = Uint8Array.of(0x03); // DBF 文件版本号
const RECORD_END = Uint8Array.of(0x0D); //字段定义终止符

const EOF = Uint8Array.of(0x1a);

/**
 * DBF Class，表示一个 DBF 文件实例
 * @example
 * ```typescript
 * const c = new Field("NAME", "C", 4);
 * const n = new Field("AGE", "N", 3, 0);
 * const dbf = new DBF([c, n], [["张三", 18], ["李四", 20]]);
 * const dbfData = dbf.data; // 获取完整的 DBF 文件二进制数据
 * ```
 */
export class DBF {
  /** DBF 文件中创建时间 */
  create_date: Date;

  /**
   * 构造一个DBF文件实例
   * @param {Field[]} fields - 字段定义数组，描述DBF文件的结构
   * @param {RecordValue[]} [records] - 可选记录数组，包含DBF文件的数据行
   */
  constructor(
    public fields: Field[],
    public records?: RecordValue[],
  ) {
    this.create_date = new Date();
  }

  /**
   * 设置DBF文件的创建日期
   * @param {Date} newdate - 新的创建日期
   * @returns {DBF} 返回当前实例以支持链式调用
   */
  set_create_date(newdate: Date): DBF {
    this.create_date = newdate;
    return this;
  }

  /**
   * 获取DBF文件头的二进制表示
   * @returns {Uint8Array} 包含文件头信息的二进制数据
   * @description
   * 计算并生成符合DBF格式的文件头，包含：
   * - 版本号 (位置0)
   * - 更新日期 (位置1-3)
   * - 记录数量 (位置4-7)
   * - 文件头长度 (位置8-9)
   * - 每条记录长度 (位置10-11)
   * - 字段定义记录
   * - 记录结束标记
   */
  get header(): Uint8Array {
    const header_define = new Uint8Array(32);
    // 文件头的总字节数量 = 字段数量 * 32 + 32 + 1
    const header_length = this.fields.length * 32 + 32 + 1;
    const record_num = this.records ? this.records.length : 0;
    const total_record_length = this.fields.reduce((sum, record) => {
      return sum + (record.length as number);
    }, 0) + 1;
    //  0 版本号
    header_define.set(DBF_FILE_VERSION, 0);
    //  1~3 更新日期
    header_define.set(get_update_date(this.create_date), 1);
    //  4~7 记录数量 Uint32
    header_define.set(new Uint8Array(Uint32Array.of(record_num).buffer), 4);
    //  8~9 当前DBF的文件头占用的字节长度 Uint16
    header_define.set(new Uint8Array(Uint16Array.of(header_length).buffer), 8);
    //  10~11 每条记录的长度 Uint16
    header_define.set(
      new Uint8Array(Int16Array.of(total_record_length).buffer),
      10,
    );

    const record_define = mergeUint8Arrays(
      this.fields.map((field) => field.record_define),
    );

    return mergeUint8Arrays([
      header_define,
      record_define,
      RECORD_END,
    ]);
  }

  /**
   * 获取完整的DBF文件二进制数据
   * @returns {Uint8Array} 包含文件头和数据记录的完整DBF文件二进制
   * @description
   * 当无记录时返回仅含文件头和EOF标记的空文件
   * 有记录时返回格式: [文件头|记录1|记录2|...|EOF]
   */
  get data(): Uint8Array {
    if (!this.records) {
      return mergeUint8Arrays([this.header, EOF]);
    }

    const records_array = this.records.map((record) =>
      record_to_uint8array(this.fields, record)
    );

    return mergeUint8Arrays([this.header, ...records_array, EOF]);
  }
}
