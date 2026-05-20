/**
 * Shapefile wrapper for Deno
 *
 * 基于 @mapbox/shp-write 的底层 `write()` 函数，
 * 从坐标数组生成 shapefile 并打包为 ZIP。
 *
 * @module
 */

import { write as shpWrite } from "@mapbox/shp-write";

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/** 单个 feature 的属性行 */
export type PropertiesRow = Record<string, string | number | boolean>;

/** @mapbox/shp-write 支持的几何类型 */
type ShpType = "POINT" | "POLYLINE" | "POLYGON";

/** 二维坐标点 */
type Point = [number, number];

/** 单条 LineString 坐标：[[x,y], [x,y], ...] */
type PolylineCoords = Point[];

/** 单条 MultiLineString 坐标：[[[x,y],...], [[x,y],...], ...] */
type MultiPolylineCoords = Point[][];

/** 单个 Polygon 坐标（环组）：[[[x,y],...], ...] */
type PolygonCoords = Point[][];

/** 单个 MultiPolygon 坐标：[[[[x,y],...],...], ...] */
export type MultiPolygonCoords = Point[][][];

/** create_shp 支持的 geometries 类型 */
type ShpGeometries =
  | Point[]
  | PolylineCoords[]
  | MultiPolylineCoords[]
  | PolygonCoords[]
  | MultiPolygonCoords[];

type ShpWriteResult = {
  shp: DataView;
  shx: DataView;
  dbf: DataView;
  prj: string;
};

// ─── 低级封装 ────────────────────────────────────────────────────────────────

/**
 * 调用 @mapbox/shp-write.write() 生成 shapefile 原始数据。
 *
 * @param type 几何类型
 * @param properties 每行属性
 * @param geometries 坐标数据
 * @returns 包含 shp / shx / dbf / prj 的 DataView
 */
export function create_shp(
  type: ShpType,
  properties: PropertiesRow[] = [],
  geometries: ShpGeometries,
): Promise<ShpWriteResult> {
  return new Promise((resolve, reject) => {
    shpWrite(properties, type, geometries, (err, result) => {
      if (err) reject(err);
      else resolve(result as ShpWriteResult);
    });
  });
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const DEFAULT_PRJ =
  'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';

// ─── 公用辅助 ────────────────────────────────────────────────────────────────

/** create_shp + 包装为 Shapefile 实例的通用逻辑 */
async function _build<T extends ShpGeometries>(
  type: ShpType,
  coords: T,
  properties: PropertiesRow[],
  prj: string,
  cpg: string,
): Promise<Shapefile> {
  if (properties.length === 0) {
    properties = coords.map(() => ({}));
  }
  if (coords.length !== properties.length) {
    throw new Error("coords 和 properties 长度必须一致");
  }
  const result = await create_shp(type, properties, coords);
  return new Shapefile(
    new Uint8Array(result.shp.buffer),
    new Uint8Array(result.shx.buffer),
    new Uint8Array(result.dbf.buffer),
    prj,
    cpg,
  );
}

// ─── Shapefile 类 ────────────────────────────────────────────────────────────

/**
 * 表示一个 shapefile，包含 .shp / .shx / .dbf / .prj / .cpg 五个组成部分。
 *
 * @example
 * ```ts
 * const shp = await Shapefile.from_points([[120, 30]], [{ name: "test" }]);
 * const zipBytes = await shp.to_zip("points");
 * await Deno.writeFile("points.zip", zipBytes);
 * ```
 */
export class Shapefile {
  /** 几何数据（只读，通过构造函数传入） */
  readonly shp: Uint8Array;
  /** 几何索引（只读） */
  readonly shx: Uint8Array;
  /** 属性数据 — dBase 格式（只读） */
  dbf: Uint8Array;
  /** 投影定义 — WKT 字符串 */
  prj: string;
  /** 编码声明 */
  cpg: string;

  constructor(
    shp: Uint8Array,
    shx: Uint8Array,
    dbf: Uint8Array,
    prj: string = DEFAULT_PRJ,
    cpg: string = "UTF-8",
  ) {
    this.shp = shp;
    this.shx = shx;
    this.dbf = dbf;
    this.prj = prj;
    this.cpg = cpg;
  }

  // ── 工厂方法 ────────────────────────────────────────────────────────────

  /** 从多个点创建 shapefile */
  static from_points(
    coords: Point[],
    properties: PropertiesRow[] = [],
    prj: string = DEFAULT_PRJ,
    cpg: string = "UTF-8",
  ): Promise<Shapefile> {
    return _build("POINT", coords, properties, prj, cpg);
  }

  /** 从多条折线创建 shapefile（支持 LineString / MultiLineString） */
  static from_polyline(
    coords: PolylineCoords[] | MultiPolylineCoords[],
    properties: PropertiesRow[] = [],
    prj: string = DEFAULT_PRJ,
    cpg: string = "UTF-8",
  ): Promise<Shapefile> {
    return _build("POLYLINE", coords, properties, prj, cpg);
  }

  /** 从多个面创建 shapefile（支持 Polygon / MultiPolygon） */
  static from_polygon(
    coords: PolygonCoords[] | MultiPolygonCoords[],
    properties: PropertiesRow[] = [],
    prj: string = DEFAULT_PRJ,
    cpg: string = "UTF-8",
  ): Promise<Shapefile> {
    return _build("POLYGON", coords, properties, prj, cpg);
  }

  // ── 实例方法 ────────────────────────────────────────────────────────────

  /**
   * 将 .shp / .shx / .dbf / .prj / .cpg 打包为 ZIP 文件。
   *
   * @param filename 文件名（不含后缀）
   * @param folder   ZIP 内子文件夹名，默认放在根目录
   * @returns ZIP 文件的 Uint8Array
   */
  async to_zip(filename: string, folder: string = ""): Promise<Uint8Array> {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const target = folder ? zip.folder(folder)! : zip;

    target.file(`${filename}.shp`, this.shp.buffer as ArrayBuffer);
    target.file(`${filename}.shx`, this.shx.buffer as ArrayBuffer);
    target.file(`${filename}.dbf`, this.dbf.buffer as ArrayBuffer);
    target.file(`${filename}.prj`, this.prj);
    target.file(`${filename}.cpg`, this.cpg);

    return await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });
  }
}
