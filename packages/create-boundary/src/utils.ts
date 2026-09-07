import type { Record } from "./source/csv.ts";
import type { Point } from "@liuxspro/geo";
import { type MultiPolygon, Polygon } from "@liuxspro/geo";

export function get_polygon_from_csv_data(csv_data: Record): MultiPolygon {
  const keys = Object.keys(csv_data[0]);
  const points = csv_data.map((item) => {
    return [item[keys[1]], item[keys[2]]] as Point;
  });
  const polygon = Polygon.from_points(points);

  return polygon.to_multipolygon();
}
