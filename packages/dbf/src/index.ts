import type { Field } from "./field.ts";
import { get_update_date } from "./utils.ts";
import { record_to_uint8array } from "./record.ts";
import { mergeUint8Arrays } from "jsr:@liuxspro/utils@0.1.12/array";

type RecordValue = (string | number | boolean | Date)[];
const DBF_FILE_VERSION = Uint8Array.of(0x03); // DBF 文件版本号
const RECORD_END = Uint8Array.of(0x0D); //字段定义终止符

const EOF = Uint8Array.of(0x1a);

export class DBF {
  create_date: Date;
  constructor(
    public fields: Field[],
    public records?: RecordValue[],
  ) {
    this.create_date = new Date();
  }

  set_create_date(newdate: Date): DBF {
    this.create_date = newdate;
    return this;
  }

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
