import { assertEquals, assertRejects } from "@std/assert";
import { type PropertiesRow, Shapefile } from "../src/index.ts";

// ── from_points ──────────────────────────────────────────────────────────────

Deno.test("from_points — 基本点", async () => {
  const coords: [number, number][] = [[120, 30], [121, 31]];
  const props: PropertiesRow[] = [{ name: "A" }, { name: "B" }];
  const shp = await Shapefile.from_points(coords, props);

  assertEquals(shp.shp instanceof Uint8Array, true);
  assertEquals(shp.shx instanceof Uint8Array, true);
  assertEquals(shp.dbf instanceof Uint8Array, true);
  assertEquals(typeof shp.prj, "string");
  assertEquals(shp.cpg, "UTF-8");
  // 2 个点，shp 最小 100 字节头 + 2×28
  assertEquals(shp.shp.length >= 156, true);
});

Deno.test("from_points — 无属性", async () => {
  const coords: [number, number][] = [[120, 30]];
  const shp = await Shapefile.from_points(coords);
  assertEquals(shp.shp.length >= 128, true);
});

Deno.test("from_points — 长度不匹配抛出异常", () => {
  const coords: [number, number][] = [[120, 30], [121, 31]];
  const props: PropertiesRow[] = [{ name: "A" }];
  assertRejects(
    () => Shapefile.from_points(coords, props),
    Error,
    "长度必须一致",
  );
});

// ── from_polyline ────────────────────────────────────────────────────────────

Deno.test("from_polyline — LineString", async () => {
  const coords: [number, number][][] = [[[0, 0], [1, 1], [2, 2]]];
  const props: PropertiesRow[] = [{ road: "A" }];
  const shp = await Shapefile.from_polyline(coords, props);
  assertEquals(shp.shp.length >= 212, true);
});

Deno.test("from_polyline — MultiLineString", async () => {
  const coords: [number, number][][][] = [
    [[[0, 0], [1, 1]], [[2, 2], [3, 3]]],
  ];
  const shp = await Shapefile.from_polyline(coords);
  assertEquals(shp.shp.length >= 1, true);
});

// ── from_polygon ─────────────────────────────────────────────────────────────

Deno.test("from_polygon — Polygon", async () => {
  const coords: [number, number][][][] = [
    [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
  ];
  const props: PropertiesRow[] = [{ name: "方形" }];
  const shp = await Shapefile.from_polygon(coords, props);
  assertEquals(shp.shp.length >= 236, true);
});

Deno.test("from_polygon — MultiPolygon", async () => {
  const coords: [number, number][][][][] = [
    [[[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]]],
  ];
  const shp = await Shapefile.from_polygon(coords);
  assertEquals(shp.shp.length >= 1, true);
});

Deno.test("from_polygon — 带孔多边形", async () => {
  const coords: [number, number][][][] = [[
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[2, 2], [2, 4], [4, 4], [4, 2], [2, 2]],
  ]];
  const shp = await Shapefile.from_polygon(coords);
  assertEquals(shp.shp.length >= 1, true);
});

// ── to_zip ───────────────────────────────────────────────────────────────────

Deno.test("to_zip — 打包并验证基本结构", async () => {
  const shp = await Shapefile.from_points([[120, 30]], [{ n: 1 }]);
  const zipBytes = await shp.to_zip("test");

  assertEquals(zipBytes instanceof Uint8Array, true);
  assertEquals(zipBytes.length > 100, true);

  // 用 JSZip 解包验证内部文件
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(zipBytes);

  // 确认文件存在且不是目录
  const names = ["test.shp", "test.shx", "test.dbf", "test.prj", "test.cpg"];
  for (const name of names) {
    const entry = zip.files[name];
    assertEquals(entry !== undefined, true, `缺少 ${name}`);
    assertEquals(entry.dir, false, `${name} 不应是目录`);
  }
});

Deno.test("to_zip — 指定子文件夹", async () => {
  const shp = await Shapefile.from_points([[120, 30]]);
  const zipBytes = await shp.to_zip("data", "folder");

  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(zipBytes);

  assertEquals(zip.files["folder/data.shp"] !== undefined, true);
  assertEquals(zip.files["folder/data.prj"] !== undefined, true);
});

// ── 自定义 prj / cpg ────────────────────────────────────────────────────────

Deno.test("自定义 prj 和 cpg", async () => {
  const prj =
    'PROJCS["Amersfoort / RD New",GEOGCS["Amersfoort",DATUM["D_Amersfoort",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",52.15616055555555],PARAMETER["central_meridian",5.38763888888889],PARAMETER["scale_factor",0.9999079],PARAMETER["false_easting",155000],PARAMETER["false_northing",463000],UNIT["Meter",1]]';
  const shp = await Shapefile.from_points(
    [[120, 30]],
    [],
    prj,
    "GBK",
  );
  assertEquals(shp.prj, prj);
  assertEquals(shp.cpg, "GBK");
});

Deno.test("自定义 dbf", async () => {
  const dfb = new Uint8Array([]);
  const shp = await Shapefile.from_points(
    [[120, 30]],
    [],
  );
  shp.dbf = dfb;
  assertEquals(shp.dbf, dfb);
});
