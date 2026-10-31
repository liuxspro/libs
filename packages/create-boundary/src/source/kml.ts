import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";
import { type Point, Polygon, Ring } from "@liuxspro/geo";

/**
 * 始终解析为数组的节点名
 *
 * KML 中同名节点可能只出现一次，也可能出现多次，统一转成数组后处理逻辑更简单
 */
const ARRAY_NODES = new Set([
  "Document",
  "Folder",
  "Placemark",
  "Polygon",
  "LineString",
  "Point",
  "MultiPoint",
  "MultiGeometry",
  "LinearRing",
  "innerBoundaryIs",
]);

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  isArray: (name) => ARRAY_NODES.has(name),
});

type Node = Record<string, unknown>;

interface GeometryBag {
  polygons: Polygon[];
  has_point: boolean;
}

function as_array(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * 解析 `<coordinates>` 节点
 *
 * KML 坐标格式为 `经度,纬度[,高程]`，点之间以空白字符分隔，
 * 同一行可能有多个点，因此按空白切分而不是按行切分。
 */
function parse_coordinates(node: unknown): Point[] {
  const record = node as Node | undefined;
  const text = record?.coordinates;
  if (typeof text !== "string") {
    return [];
  }
  return text
    .trim()
    .split(/\s+/)
    .map((item) => item.split(","))
    .filter((parts) => parts.length >= 2)
    .map(([lon, lat]) => [Number(lon), Number(lat)] as Point)
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
}

/** 从 `<outerBoundaryIs>` / `<innerBoundaryIs>` 节点取环 */
function parse_ring(boundary: unknown): Ring | null {
  const record = boundary as Node | undefined;
  const linear_ring = as_array(record?.LinearRing)[0] as Node | undefined;
  if (!linear_ring) {
    return null;
  }
  const points = parse_coordinates(linear_ring);
  if (points.length < 3) {
    return null;
  }
  return new Ring(points);
}

/** 从 `<Polygon>` 节点取外环与内环（洞） */
function parse_polygon(node: unknown): Polygon | null {
  const record = node as Node | undefined;
  if (!record) {
    return null;
  }
  const outer_ring = parse_ring(record.outerBoundaryIs);
  if (!outer_ring) {
    return null;
  }
  const inner_rings = as_array(record.innerBoundaryIs)
    .map(parse_ring)
    .filter((ring): ring is Ring => ring !== null);
  return new Polygon([outer_ring, ...inner_rings]);
}

/** 把一组 `<LineString>` 当作一个多环多边形（与 create-shp 的行为保持一致） */
function parse_line_strings(nodes: unknown[]): Polygon | null {
  const rings = nodes
    .map((node) => parse_coordinates(node as Node))
    .filter((points) => points.length >= 3)
    .map((points) => new Ring(points));
  if (rings.length === 0) {
    return null;
  }
  return new Polygon(rings);
}

function is_line_only(record: Node): boolean {
  const keys = [
    "Polygon",
    "Point",
    "MultiPoint",
    "MultiGeometry",
  ];
  return keys.every((key) => record[key] === undefined);
}

/** 递归遍历解析结果，收集所有几何 */
function collect(node: unknown, bag: GeometryBag): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collect(item, bag);
    }
    return;
  }
  if (node === null || typeof node !== "object") {
    return;
  }

  const record = node as Node;

  const polygons = record.Polygon;
  if (Array.isArray(polygons)) {
    for (const polygon of polygons) {
      const parsed = parse_polygon(polygon);
      if (parsed) {
        bag.polygons.push(parsed);
      }
    }
    return;
  }

  const multi_geometry = record.MultiGeometry;
  if (Array.isArray(multi_geometry)) {
    for (const geometry of multi_geometry) {
      const geometry_record = geometry as Node;
      // 多个 LineString 组成一个地块的多条边界线，视为同一个多环多边形
      if (is_line_only(geometry_record)) {
        const parsed = parse_line_strings(as_array(geometry_record.LineString));
        if (parsed) {
          bag.polygons.push(parsed);
        }
        continue;
      }
      collect(geometry, bag);
    }
    return;
  }

  const lines = record.LineString;
  if (Array.isArray(lines)) {
    for (const line of lines) {
      const parsed = parse_line_strings([line]);
      if (parsed) {
        bag.polygons.push(parsed);
      }
    }
    return;
  }

  if (record.Point !== undefined || record.MultiPoint !== undefined) {
    bag.has_point = true;
    return;
  }

  for (const value of Object.values(record)) {
    collect(value, bag);
  }
}

/**
 * 解析 KML 文本
 *
 * 返回 WGS84 经纬度坐标的多边形列表，坐标转换与 Shapefile 生成由调用方处理。
 * 支持 `Polygon`、`MultiPolygon`、`LineString`、`MultiLineString`。
 *
 * @param kml KML 文本
 * @returns 多边形列表
 * @throws 文件中没有可用于生成边界的几何时抛出错误
 */
export function parse_kml_content(kml: string): Polygon[] {
  if (kml.trimStart().startsWith("PK")) {
    throw new Error("这是 KMZ（ZIP）文件，请按 .kmz 解析");
  }
  const bag: GeometryBag = { polygons: [], has_point: false };
  collect(parser.parse(kml), bag);
  if (bag.polygons.length === 0) {
    if (bag.has_point) {
      throw new Error("KML 文件中为点数据，无法解析为多边形");
    }
    throw new Error("KML 文件中未检测到多边形数据");
  }
  return bag.polygons;
}

/**
 * 从 KMZ 文件中提取 KML 文本
 *
 * 优先取 `doc.kml`，否则取压缩包中第一个 `.kml` 文件。
 *
 * @param kmz KMZ 文件内容
 * @returns KML 文本
 * @throws 不是有效的 ZIP 文件，或压缩包中没有 .kml 文件时抛出错误
 */
export function get_kml_from_kmz(kmz: Uint8Array): string {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(kmz);
  } catch {
    throw new Error("KMZ 文件解析失败，不是有效的 ZIP 文件");
  }
  const names = Object.keys(entries).filter((name) => !name.endsWith("/"));
  const kml_name = names.find((name) => name.toLowerCase() === "doc.kml") ??
    names.find((name) => name.toLowerCase().endsWith(".kml"));
  if (!kml_name) {
    throw new Error("KMZ 文件中未找到 .kml 文件");
  }
  return strFromU8(entries[kml_name]);
}
