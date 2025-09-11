import { assertEquals, assertThrows } from "jsr:@std/assert";
import { DBF, Field } from "../../src/dbf/mod.ts";

// 测试DBF类的基本构造函数和属性
Deno.test("DBF构造函数 - 基本功能", function () {
  const fields = [
    new Field("NAME", "C", 10),
    new Field("AGE", "N", 3),
    new Field("ACTIVE", "L"),
  ];

  const dbf = new DBF(fields);

  assertEquals(dbf.fields.length, 3);
  assertEquals(dbf.fields[0].name, "NAME");
  assertEquals(dbf.fields[1].name, "AGE");
  assertEquals(dbf.fields[2].name, "ACTIVE");
  assertEquals(dbf.records, undefined);
});

Deno.test("DBF构造函数 - 带记录", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  const records = [
    ["张三", 25],
    ["李四", 30],
  ];

  const dbf = new DBF(fields, records);

  assertEquals(dbf.fields.length, 2);
  assertEquals(dbf.records?.length, 2);
  assertEquals(dbf.records?.[0], ["张三", 25]);
  assertEquals(dbf.records?.[1], ["李四", 30]);
});

// 测试DBF类的header属性生成
Deno.test("DBF header - 基本结构", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  const dbf = new DBF(fields);
  const header = dbf.header;

  // 检查header长度：32字节文件头 + 2个字段*32字节 + 1字节终止符
  assertEquals(header.length, 32 + 2 * 32 + 1);

  // 检查版本号（第0字节）
  assertEquals(header[0], 0x03);

  // 检查记录数量（第4-7字节，应该是0）
  const recordCount = new Uint32Array(header.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 0);

  // 检查文件头长度（第8-9字节）
  const headerLength = new Uint16Array(header.slice(8, 10).buffer)[0];
  assertEquals(headerLength, 32 + 2 * 32 + 1);

  // 检查记录长度（第10-11字节）
  const recordLength = new Uint16Array(header.slice(10, 12).buffer)[0];
  assertEquals(recordLength, 1 + 10 + 3); // 删除标志 + NAME字段 + AGE字段

  // 检查终止符（最后1字节）
  assertEquals(header[header.length - 1], 0x0d);
});

Deno.test("DBF header - 带记录的header", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  const records = [
    ["张三", 25],
    ["李四", 30],
  ];

  const dbf = new DBF(fields, records);
  const header = dbf.header;

  // 检查记录数量（第4-7字节，应该是2）
  const recordCount = new Uint32Array(header.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 2);
});

Deno.test("DBF header - 不同字段类型的记录长度计算", function () {
  const fields = [
    new Field("NAME", "C", 20), // 20字节
    new Field("AGE", "N", 5, 2), // 6字节（5+1小数点）
    new Field("ACTIVE", "L"), // 1字节
    new Field("BIRTH", "D"), // 8字节
  ];

  const dbf = new DBF(fields);
  const header = dbf.header;

  // 检查记录长度（第10-11字节）
  const recordLength = new Uint16Array(header.slice(10, 12).buffer)[0];
  assertEquals(recordLength, 1 + 20 + 6 + 1 + 8); // 删除标志 + 各字段长度
});

// 测试DBF类的data属性生成（无记录）
Deno.test("DBF data - 无记录情况", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  const dbf = new DBF(fields);
  const data = dbf.data;

  // 数据应该包含header + EOF
  assertEquals(data.length, dbf.header.length + 1);

  // 检查EOF标志（最后1字节）
  assertEquals(data[data.length - 1], 0x1a);

  // 检查header部分是否相同
  const headerPart = data.slice(0, dbf.header.length);
  assertEquals(headerPart, dbf.header);
});

// 测试DBF类的data属性生成（有记录）
Deno.test("DBF data - 有记录情况", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  const records = [
    ["张三", 25],
    ["李四", 30],
  ];

  const dbf = new DBF(fields, records);
  const data = dbf.data;

  // 数据应该包含header + 2条记录 + EOF
  const expectedLength = dbf.header.length + 2 * (1 + 10 + 3) + 1; // header + 2条记录 + EOF
  assertEquals(data.length, expectedLength);

  // 检查EOF标志（最后1字节）
  assertEquals(data[data.length - 1], 0x1a);

  // 检查header部分
  const headerPart = data.slice(0, dbf.header.length);
  assertEquals(headerPart, dbf.header);

  // 检查记录数量
  const recordCount = new Uint32Array(data.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 2);
});

Deno.test("DBF data - 复杂记录类型", function () {
  const fields = [
    new Field("NAME", "C", 10),
    new Field("AGE", "N", 3),
    new Field("ACTIVE", "L"),
    new Field("BIRTH", "D"),
  ];

  const testDate = new Date("1990-01-01");
  const records = [
    ["张三", 25, true, testDate],
    ["李四", 30, false, testDate],
  ];

  const dbf = new DBF(fields, records);
  const data = dbf.data;

  // 检查数据长度
  const recordLength = 1 + 10 + 3 + 1 + 8; // 删除标志 + 各字段长度
  const expectedLength = dbf.header.length + 2 * recordLength + 1;
  assertEquals(data.length, expectedLength);

  // 检查记录数量
  const recordCount = new Uint32Array(data.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 2);
});

// 测试边界情况和错误处理
Deno.test("DBF - 空字段数组", function () {
  const dbf = new DBF([]);

  // 应该能正常创建
  assertEquals(dbf.fields.length, 0);
  assertEquals(dbf.records, undefined);

  // header应该只包含基本的32字节 + 终止符
  const header = dbf.header;
  assertEquals(header.length, 32 + 1);

  // 记录长度应该是1（只有删除标志）
  const recordLength = new Uint16Array(header.slice(10, 12).buffer)[0];
  assertEquals(recordLength, 1);
});

Deno.test("DBF - 大量字段", function () {
  const fields = [];
  for (let i = 0; i < 100; i++) {
    fields.push(new Field(`FIELD${i}`, "C", 10));
  }

  const dbf = new DBF(fields);

  assertEquals(dbf.fields.length, 100);

  // 检查header长度
  const header = dbf.header;
  assertEquals(header.length, 32 + 100 * 32 + 1);

  // 检查记录长度
  const recordLength = new Uint16Array(header.slice(10, 12).buffer)[0];
  assertEquals(recordLength, 1 + 100 * 10); // 删除标志 + 100个字段
});

Deno.test("DBF - 记录与字段数量不匹配", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  // 记录数量与字段数量不匹配
  const records = [
    ["张三"], // 只有1个值，但字段有2个
  ];

  const dbf = new DBF(fields, records);

  // 创建DBF对象应该成功，但在生成data时会出错
  assertThrows(
    () => {
      dbf.data;
    },
    Error,
    "记录所包含的值数量与字段定义不同",
  );
});

Deno.test("DBF - 记录类型与字段类型不匹配", function () {
  const fields = [new Field("NAME", "C", 10), new Field("AGE", "N", 3)];

  // 记录类型与字段类型不匹配
  const records = [
    [123, "不是数字"], // NAME应该是字符串，AGE应该是数字
  ];

  const dbf = new DBF(fields, records);

  // 创建DBF对象应该成功，但在生成data时会出错
  assertThrows(
    () => {
      dbf.data;
    },
    Error,
    "记录类型与字段定义不符合",
  );
});

Deno.test("DBF - 日期字段处理", function () {
  const fields = [new Field("NAME", "C", 10), new Field("BIRTH", "D")];

  const testDate = new Date("1990-05-15");
  const records = [["张三", testDate]];

  const dbf = new DBF(fields, records);
  const data = dbf.data;

  // 应该能正常生成数据
  assertEquals(data.length > 0, true);

  // 检查记录数量
  const recordCount = new Uint32Array(data.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 1);
});

Deno.test("DBF - 布尔字段处理", function () {
  const fields = [new Field("NAME", "C", 10), new Field("ACTIVE", "L")];

  const records = [
    ["张三", true],
    ["李四", false],
  ];

  const dbf = new DBF(fields, records);
  const data = dbf.data;

  // 应该能正常生成数据
  assertEquals(data.length > 0, true);

  // 检查记录数量
  const recordCount = new Uint32Array(data.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 2);
});

Deno.test("DBF - 数值字段精度处理", function () {
  const fields = [
    new Field("PRICE", "N", 8, 2), // 8位长度，2位小数
  ];

  const records = [[123.45], [999.99]];

  const dbf = new DBF(fields, records);
  const data = dbf.data;

  // 应该能正常生成数据
  assertEquals(data.length > 0, true);

  // 检查记录数量
  const recordCount = new Uint32Array(data.slice(4, 8).buffer)[0];
  assertEquals(recordCount, 2);
});

Deno.test("DBF - 与Arcmap生成的DBF文件对比", async function () {
  const dxz = new Field("短整型", "N", 5);
  const cxz = new Field("长整型", "N", 10);
  const fdx = new Field("浮点型", "N", 16, 2);
  const sjd = new Field("双精度", "N", 16, 2);
  const wb = new Field("文本", "C", 50);
  const rq = new Field("日期", "D");

  const record_1 = [1, 1, 1.23, 4.56, "text1", new Date("2025-9-6")];
  const record_2 = [
    99999,
    999999999,
    999.99,
    9999.99,
    "text2",
    new Date("2025-9-7"),
  ];

  const dbf = new DBF([dxz, cxz, fdx, sjd, wb, rq], [record_1, record_2]);
  dbf.set_create_date(new Date("2025-9-6"));
  const arcmap = await Deno.readFile("./tests/dbf/data/arcmap_gen.dbf");
  assertEquals(dbf.data, arcmap);
});

Deno.test("DBF - 空值处理", function () {
  const dxz = new Field("短整型", "N", 5);
  const cxz = new Field("长整型", "N", 10);
  const fdx = new Field("浮点型", "N", 16, 2);
  const sjd = new Field("双精度", "N", 16, 2);
  const wb = new Field("文本", "C", 50);
  const rq = new Field("日期", "D");

  const record_1 = [1, null, 1.23, null, null, null];
  const dbf = new DBF([dxz, cxz, fdx, sjd, wb, rq], [record_1]);
  dbf.set_create_date(new Date("2025-9-6"));
  Deno.writeFileSync("./tests/dbf/data/null_value.dbf", dbf.data);
});
