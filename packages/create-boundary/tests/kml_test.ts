import { join } from "jsr:@std/path";
import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert";
import { strToU8, unzipSync, zipSync } from "fflate";
import { parse_kml_content } from "../src/source/kml.ts";
import { get_polygon_from_kml_data } from "../src/utils.ts";
import {
  file_to_shp,
  kml_to_shp,
  kmz_to_shp,
  make_boundary_zip,
} from "../src/boundary.ts";

const dirname = import.meta.dirname;
const kml_dir = join(dirname!, "data/kml");
const csv_dir = join(dirname!, "data/csv");

function read_kml(name: string): string {
  return Deno.readTextFileSync(join(kml_dir, name));
}

function read_binary(name: string): Uint8Array {
  return Deno.readFileSync(join(kml_dir, name));
}

Deno.test("KML: 解析单个多边形", async () => {
  const kml = read_kml("地块红线_Polygon.kml");
  const polygons = parse_kml_content(kml);
  assertEquals(polygons.length, 1);
  assertEquals(polygons[0].rings.length, 1);
  // 6 个点 + 自动闭合 = 7
  assertEquals(polygons[0].rings[0].points.length, 7);

  const info = await kml_to_shp(kml);
  assertEquals(info.DH, 39);
  assertEquals(info.YDMJ, 129068.42);
});

Deno.test("KML: 高程不参与计算", async () => {
  const kml = read_kml("地块红线_Polygon2.kml");
  const polygons = parse_kml_content(kml);
  assertEquals(polygons[0].rings[0].points.length, 7);
  for (const point of polygons[0].rings[0].points) {
    assertEquals(point.length, 2);
  }

  const info = await kml_to_shp(kml);
  assertEquals(info.DH, 39);
  assertEquals(info.YDMJ, 74522.03);
});

Deno.test("KML: 多个多边形", async () => {
  const kml = read_kml("含有多个多边形.kml");
  const polygons = parse_kml_content(kml);
  assertEquals(polygons.length, 2);
  assertEquals(polygons.map((p) => p.rings.length), [1, 1]);

  const info = await kml_to_shp(kml);
  assertEquals(info.DH, 39);
  // 两块面积之和
  assertEquals(info.YDMJ, 178294.77);
});

Deno.test("KML: 带孔洞的多边形", async () => {
  const kml = read_kml("含有孔洞的多边形.kml");
  const polygons = parse_kml_content(kml);
  assertEquals(polygons.length, 1);
  assertEquals(polygons[0].rings.length, 2);
  // 总面积 = 外环面积 - 内环面积
  const [outer, inner] = polygons[0].rings;
  assertEquals(
    Math.abs(outer.get_area()) > Math.abs(inner.get_area()),
    true,
  );

  const info = await kml_to_shp(kml);
  assertEquals(info.DH, 39);
  assertEquals(info.YDMJ, 122466.36);
});

Deno.test("KML: MultiGeometry 中的 LineString 与 Polygon 结果一致", async () => {
  const polygon_info = await kml_to_shp(read_kml("地块红线_MultiPolygon.kml"));
  const line_info = await kml_to_shp(read_kml("地块红线_MultiLineString.kml"));

  assertEquals(polygon_info.DH, 39);
  assertEquals(line_info.DH, 39);
  assertEquals(line_info.YDMJ, polygon_info.YDMJ);
  assertEquals(polygon_info.YDMJ, 130241.5);
});

Deno.test("KML: 混合几何（Polygon + LineString）", async () => {
  const kml = read_kml("测试.kml");
  const polygons = parse_kml_content(kml);
  assertEquals(polygons.length, 3);

  const info = await kml_to_shp(kml);
  assertEquals(info.DH, 39);
  assertEquals(info.YDMJ, 132862.36);
});

Deno.test("KML: 投影坐标 X 含带号", () => {
  const polygon = get_polygon_from_kml_data(read_kml("地块红线_Polygon.kml"));
  const x = polygon.first_point[0];
  assertEquals(Math.trunc(Math.abs(x)).toString().length, 8);
  assertEquals(Math.trunc(x).toString().slice(0, 2), "39");
});

Deno.test("KML: 点数据报错", () => {
  assertThrows(
    () => parse_kml_content(read_kml("地块红线_Point.kml")),
    Error,
    "点数据",
  );
});

Deno.test("KML: 没有几何时报错", () => {
  assertThrows(
    () => parse_kml_content("<?xml version='1.0'?><kml><Document/></kml>"),
    Error,
    "未检测到多边形数据",
  );
  assertThrows(() => parse_kml_content(""), Error, "未检测到多边形数据");
});

Deno.test("KML: 把 KMZ 当 KML 解析时报错", () => {
  assertThrows(
    () => parse_kml_content("PK\u0003\u0004rest"),
    Error,
    "KMZ",
  );
});

Deno.test("KMZ: 解析真实文件", async () => {
  const kmz = read_binary("地块红线_MultiPolygon.kmz");
  const info = await kmz_to_shp(kmz);
  assertEquals(info.DH, 39);
  assertEquals(info.YDMJ, 130241.5);

  const line_info = await kmz_to_shp(read_binary("地块红线_LineString.kmz"));
  assertEquals(line_info.DH, 39);
  assertEquals(line_info.YDMJ, 129319.47);
});

Deno.test("KMZ: 压缩包内文件名不是 doc.kml", async () => {
  const kml = read_kml("地块红线_Polygon.kml");
  const kmz = zipSync({ "地块边界.kml": strToU8(kml) });
  const info = await kmz_to_shp(kmz);
  assertEquals(info.YDMJ, 129068.42);
});

Deno.test("KMZ: 不是 ZIP 文件时报错", async () => {
  await assertRejects(
    () => kmz_to_shp(strToU8("not a zip")),
    Error,
    "不是有效的 ZIP 文件",
  );
});

Deno.test("KMZ: 压缩包内没有 KML 文件时报错", async () => {
  const kmz = zipSync({ "readme.txt": strToU8("hello") });
  await assertRejects(
    () => kmz_to_shp(kmz),
    Error,
    "未找到 .kml 文件",
  );
});

Deno.test("file_to_shp: 按扩展名分派", async () => {
  const csv = Deno.readTextFileSync(join(csv_dir, "坐标-经纬度.csv"));
  const kml = read_kml("地块红线_Polygon.kml");
  const kmz = read_binary("地块红线_MultiPolygon.kmz");

  assertEquals((await file_to_shp("a.csv", csv)).DH, 39);
  assertEquals((await file_to_shp("a.KML", kml)).YDMJ, 129068.42);
  assertEquals((await file_to_shp("a.kmz", kmz)).YDMJ, 130241.5);
  // KMZ 必须传二进制，文本内容会被拒绝
  await assertRejects(
    () => file_to_shp("a.kmz", new TextDecoder().decode(kmz)),
    Error,
    "需要以二进制方式读取",
  );
});

Deno.test("file_to_shp: 不支持的文件类型", async () => {
  await assertRejects(
    () => file_to_shp("a.geojson", "{}"),
    Error,
    "不支持的文件类型",
  );
});

Deno.test("KML: 生成 ZIP 五件套", async () => {
  const info = await kml_to_shp(read_kml("地块红线_Polygon.kml"));
  const zip = await make_boundary_zip("初步调查", {
    DKMC: "测试地块",
    DKDM: "3401002026001",
    XZQDM: "340102",
    XZQMC: "测试区",
    YDMJ: info.YDMJ,
    DH: info.DH,
    SCRQ: new Date("2026-10-31"),
    SCDW: null,
    BZ: null,
  }, info.shp);

  const names = Object.keys(unzipSync(zip)).sort();
  assertEquals(names.length, 5);
  for (const ext of ["cpg", "dbf", "prj", "shp", "shx"]) {
    assertEquals(
      names.some((name) => name.endsWith(`.${ext}`)),
      true,
    );
  }
  assertStringIncludes(names[0], "初步调查3401002026001");
});
