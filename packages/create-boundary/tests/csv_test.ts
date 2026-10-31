import { join } from "jsr:@std/path";
import { parse_csv_content } from "../src/source/csv.ts";
import { get_polygon_from_csv_data } from "../src/utils.ts";
import { csv_to_shp } from "../src/boundary.ts";
import { assertEquals, assertThrows } from "jsr:@std/assert";

const dirname = import.meta.dirname;
let csv_dir: string;
if (dirname) {
  csv_dir = join(dirname, "data/csv");
}

Deno.test("CSV: get_polygon_from_csv_data", function () {
  for (const dir_entry of Deno.readDirSync(csv_dir)) {
    if (dir_entry.isFile && dir_entry.name.endsWith(".csv")) {
      const file_path = join(csv_dir, dir_entry.name);
      const text = Deno.readTextFileSync(file_path);
      const csv_data = parse_csv_content(text);
      // 缺失带号报错
      if (file_path.includes("无带号")) {
        assertThrows(
          () => get_polygon_from_csv_data(csv_data),
          Error,
          "X 缺失带号",
        );
        continue;
      }
      const polygon = get_polygon_from_csv_data(csv_data);
      const x = polygon.first_point[0];
      const y = polygon.first_point[1];
      assertEquals(typeof x, "number");
      assertEquals(Math.round(x).toString().length, 8);
      assertEquals(typeof y, "number");
    }
  }
});

Deno.test("CSV: 无标题行时自动补表头", async function () {
  const headerless = `1,117.513070,34.307738
2,117.513274,34.309178
3,117.514937,34.309049
4,117.514722,34.305380
5,117.510045,34.305752
6,117.510372,34.307986`;
  const with_header = `编号,经度,纬度\n${headerless}`;

  assertEquals(parse_csv_content(headerless).length, 6);
  const a = await csv_to_shp(headerless);
  const b = await csv_to_shp(with_header);
  assertEquals(a.YDMJ, b.YDMJ);
  assertEquals(a.DH, b.DH);
});

Deno.test("CSV: 支持制表符 / 连续空格 / 分号分隔", async function () {
  const rows = [
    ["J1", "118.744815", "34.092357"],
    ["J2", "118.745308", "34.094175"],
    ["J3", "118.745558", "34.094757"],
    ["J4", "118.747009", "34.094464"],
  ];
  const variants: Record<string, string> = {
    comma: rows.map((row) => row.join(",")).join("\n"),
    tab: rows.map((row) => row.join("\t")).join("\n"),
    spaces: rows.map((row) => row.join("   ")).join("\n"),
    single_space: rows.map((row) => row.join(" ")).join("\n"),
    semicolon: rows.map((row) => row.join(";")).join("\n"),
  };

  const expected = await csv_to_shp(variants.comma);
  for (const [name, text] of Object.entries(variants)) {
    const info = await csv_to_shp(text);
    assertEquals(info.YDMJ, expected.YDMJ, name);
    assertEquals(info.DH, expected.DH, name);
    assertEquals(parse_csv_content(text).length, 4, name);
  }
});

Deno.test("CSV: 去除 BOM", function () {
  const text =
    "\uFEFF编号,经度,纬度\n1,117.513070,34.307738\n2,117.513274,34.309178\n3,117.514937,34.309049";
  const records = parse_csv_content(text);
  assertEquals(records.length, 3);
  assertEquals(records[0]["经度"], 117.51307);
});

Deno.test("CSV: 没有坐标数据时报错", function () {
  assertThrows(
    () => get_polygon_from_csv_data(parse_csv_content("")),
    Error,
    "CSV 中没有坐标数据",
  );
  assertThrows(
    () => get_polygon_from_csv_data(parse_csv_content("编号,经度,纬度")),
    Error,
    "CSV 中没有坐标数据",
  );
});

Deno.test("CSV: parse csv string", function () {
  const csv = `
    编号,经度,纬度
    1,117.513070,34.307738
    2,117.513274,34.309178
    3,117.514937,34.309049
    4,117.514722,34.305380
    5,117.510045,34.305752
    6,117.510372,34.307986
    `;
  const polygon = get_polygon_from_csv_data(parse_csv_content(csv));
  assertEquals(polygon.first_point, [39547228.48121143, 3797916.520456376]);
});
