import { encode_text, type FieldType, type FieldTypeSign } from "./utils.ts";

const FieldSize = {
  "C": 254,
  "N": 18,
  "L": 1,
  "D": 8,
};

export class Field {
  constructor(
    name: string,
    type: "N",
    length: number,
    precision?: number,
  );
  constructor(
    name: string,
    type: "C",
    length: number,
  );
  constructor(
    name: string,
    type: "D" | "L",
    length?: number,
    precision?: number,
  );
  constructor(
    public name: string,
    public type: FieldTypeSign | FieldType,
    public length?: number,
    public precision?: number,
  ) {
    // 检查 字段名称是否超过了11
    if (this.name.length > 11) {
      throw new Error("字段名称长度应小于11比特");
    }
    // 根据字段类型赋值长度和精度
    // 对于布尔和日期型，长度固定为1和8，精度为0
    // 对于文本型，精度为0
    if (this.type == "L") {
      this.length = 1;
      this.precision = 0;
    }
    if (this.type == "D") {
      this.length = 8;
      this.precision = 0;
    }
    if (this.type == "C") {
      this.precision = 0;
    }
    // 当数据类型为浮点型或双精度的时候(Number类型)，如果设置了小数位数(精度)，则字段长度要加 1 (小数点占 1 位)
    if (this.type == "N") {
      if (this.precision) {
        this.length = this.length as number + 1;
      } else {
        this.precision = 0;
      }
    }
  }

  get record_define(): Uint8Array {
    const data = new Uint8Array(32);
    const max_field_length = FieldSize[this.type];
    // 设置字段名称和字段类型
    const encoded_name = encode_text(this.name);
    data.set(encoded_name, 0);
    data.set(encode_text(this.type), 11);

    // 设置字段长度、精度
    // 布尔型和日期型长度为固定(1和8)
    if (this.type === "L" || this.type === "D") {
      data.set(
        new Uint8Array([max_field_length]),
        16,
      );
    }

    if (this.type === "C") {
      if (this.length) {
        data.set(new Uint8Array([this.length]), 16);
      } else {
        // data.set(new Uint8Array([(this.value as string).length]), 16);
      }
    }
    // 对于数值型，需要设置精度
    // arcmap 中“小数位数”为此处的精度，“精度”为字段长度
    // 当数据类型为浮点型或双精度的时候(其实都是Number类型)，如果设置了小数位数，则字段长度要加 1(小数点占 1 位)
    if (this.type === "N") {
      data.set(new Uint8Array([this.length as number]), 16);
      if (this.precision) {
        data.set(new Uint8Array([this.precision]), 17);
      }
    }

    return data;
  }
}
