import { join } from "jsr:@std/path";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { unzipSync } from "fflate";
import {
  file_to_shp,
  files_to_shp,
  make_boundary_zip,
} from "../src/boundary.ts";

const dirname = import.meta.dirname!;

function read_csv(name: string): string {
  return Deno.readTextFileSync(join(dirname, "data/csv", name));
}

function read_kml(name: string): string {
  return Deno.readTextFileSync(join(dirname, "data/kml", name));
}

/**
 * 读取 SHP 主文件中的 NumParts
 *
 * 布局：0-99 文件头，100-107 记录头，108-111 shape type，
 * 112-143 包围盒（4 个 double），144-147 NumParts
 */
function num_parts(shp: Uint8Array): number {
  const view = new DataView(shp.buffer, shp.byteOffset, shp.byteLength);
  return view.getInt32(144, true);
}

/** 读取 SHPX 中的记录数（每条记录 8 字节，前 100 字节为文件头） */
function num_records(shx: Uint8Array): number {
  return (shx.byteLength - 100) / 8;
}

Deno.test("合并：两个 CSV 的面积等于各自之和", async () => {
  const a = read_csv("坐标-经纬度.csv");
  const b = read_csv("坐标2-经纬度.csv");
  const single_a = await file_to_shp("a.csv", a);
  const single_b = await file_to_shp("b.csv", b);

  const merged = await files_to_shp([
    { name: "a.csv", content: a },
    { name: "b.csv", content: b },
  ]);

  assertEquals(merged.DH, single_a.DH);
  assertEquals(merged.DH, single_b.DH);
  // 各自面积已四舍五入，合并后重新取整，允许 0.02 的舍入差
  assertEquals(
    Math.abs(merged.YDMJ - single_a.YDMJ - single_b.YDMJ) < 0.02,
    true,
  );
  // 两个单环多边形 → 两个 part
  assertEquals(num_parts(merged.shp.shp), 2);
  // 始终只有一条记录，否则会与单条记录的 DBF 错位
  assertEquals(num_records(merged.shp.shx), 1);
});

Deno.test("合并：CSV + KML（KML 含多个多边形）", async () => {
  const csv = read_csv("坐标-经纬度.csv");
  const kml = read_kml("含有多个多边形.kml");

  const csv_info = await file_to_shp("a.csv", csv);
  const kml_info = await file_to_shp("b.kml", kml);
  const merged = await files_to_shp([
    { name: "a.csv", content: csv },
    { name: "b.kml", content: kml },
  ]);

  assertEquals(csv_info.DH, 39);
  assertEquals(merged.DH, 39);
  assertEquals(
    Math.abs(merged.YDMJ - csv_info.YDMJ - kml_info.YDMJ) < 0.02,
    true,
  );
  // CSV 1 个多边形 + KML 2 个多边形
  assertEquals(num_parts(merged.shp.shp), 3);
  assertEquals(num_records(merged.shp.shx), 1);
});

Deno.test("合并：带孔洞的多边形产生外环与内环两个 part", async () => {
  const kml = read_kml("含有孔洞的多边形.kml");
  const merged = await files_to_shp([{ name: "hole.kml", content: kml }]);
  assertEquals(num_parts(merged.shp.shp), 2);
});

Deno.test("合并：空列表报错", async () => {
  await assertRejects(
    () => files_to_shp([]),
    Error,
    "请至少提供一个边界文件",
  );
});

Deno.test("合并：报错时带上出错的文件名", async () => {
  const csv = read_csv("坐标-经纬度.csv");
  await assertRejects(
    () =>
      files_to_shp([
        { name: "ok.csv", content: csv },
        { name: "点数据.kml", content: read_kml("地块红线_Point.kml") },
      ]),
    Error,
    "解析 点数据.kml 失败",
  );
});

Deno.test("合并：ZIP 内 shp / shx / dbf 记录数一致，多边形为多个 part", async () => {
  const merged = await files_to_shp([
    { name: "a.csv", content: read_csv("坐标-经纬度.csv") },
    { name: "b.csv", content: read_csv("坐标2-经纬度.csv") },
  ]);
  const zip = await make_boundary_zip("初步调查", {
    DKMC: "测试地块",
    DKDM: "3401002026001",
    XZQDM: "340102",
    XZQMC: "测试区",
    YDMJ: merged.YDMJ,
    DH: merged.DH,
    SCRQ: new Date("2026-10-31"),
    SCDW: null,
    BZ: null,
  }, merged.shp);

  const entries = unzipSync(zip);
  const shp = entries["初步调查3401002026001.shp"];
  const shx = entries["初步调查3401002026001.shx"];
  const dbf = entries["初步调查3401002026001.dbf"];

  // 只能有一条记录：shp / shx / dbf 一致
  assertEquals(num_records(shx), 1);
  assertEquals(
    new DataView(dbf.buffer, dbf.byteOffset, dbf.byteLength).getUint32(4, true),
    1,
  );
  // 两个多边形是同一记录的两个 part
  assertEquals(num_parts(shp), 2);
});

Deno.test("合并：不支持的文件类型带上文件名", async () => {
  await assertRejects(
    () => files_to_shp([{ name: "a.geojson", content: "{}" }]),
    Error,
    "解析 a.geojson 失败: 不支持的文件类型",
  );
});
