import type { Record } from "./source/csv.ts";
import type { Point } from "@liuxspro/geo";
import { correct_points_order, MultiPolygon, Polygon } from "@liuxspro/geo";
import { lonlat_to_cgcs } from "./transform.ts";
import { parse_kml_content } from "./source/kml.ts";

export function get_polygon_from_csv_data(csv_data: Record): MultiPolygon {
  if (csv_data.length === 0) {
    throw new Error("CSV 中没有坐标数据");
  }
  const keys = Object.keys(csv_data[0]);
  const points = csv_data.map((item) => {
    return [item[keys[1]], item[keys[2]]] as Point;
  });
  const polygon = Polygon.from_points(points);
  let transformed_polygon: Polygon;
  // 判断点坐标是经纬度还是XY
  const first_point = polygon.first_point;
  const x = first_point[0];
  // 如果x小于200
  if (x < 200) {
    transformed_polygon = polygon.transform(lonlat_to_cgcs).transform(
      correct_points_order,
    );
  } else {
    transformed_polygon = polygon.transform(correct_points_order);
  }

  return transformed_polygon.ensure_esri_standard().to_multipolygon();
}

/**
 * 从 KML 数据创建 CGCS2000 投影坐标的多边形
 *
 * KML 坐标为 WGS84 经纬度，统一转换为投影坐标后再生成 Shapefile。
 * @param kml KML 文本
 * @returns 投影坐标的多边形
 */
export function get_polygon_from_kml_data(kml: string): MultiPolygon {
  const polygons = parse_kml_content(kml);
  return new MultiPolygon(polygons)
    .transform(lonlat_to_cgcs)
    .transform(correct_points_order)
    .ensure_esri_standard();
}

/**
 * 合并多个多多边形
 *
 * 各多多边形的多边形按顺序拼接，面积与带号由调用方按合并结果重新计算。
 * @param items 多多边形列表
 * @returns 合并后的多多边形
 * @throws 列表为空或没有任何多边形时抛出错误
 */
export function merge_multipolygons(items: MultiPolygon[]): MultiPolygon {
  const polygons = items.flatMap((item) => item.polygons);
  if (polygons.length === 0) {
    throw new Error("没有可合并的多边形");
  }
  return new MultiPolygon(polygons);
}
