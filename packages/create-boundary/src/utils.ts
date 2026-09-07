import type { Record } from "./source/csv.ts";
import type { Point } from "@liuxspro/geo";
import { correct_points_order, Polygon } from "@liuxspro/geo";
import type { MultiPolygon } from "@liuxspro/geo";
import { lonlat_to_cgcs } from "./transform.ts";

export function get_polygon_from_csv_data(csv_data: Record): MultiPolygon {
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

  return transformed_polygon.to_multipolygon();
}
