import { type Record } from "./source/csv.ts";
import type { Point } from "@liuxspro/geo";
import { MultiPolygon, Polygon } from "@liuxspro/geo";
import { create_dbf, type Fields } from "./dbf.ts";
import { type MultiPolygonCoords, Shapefile } from "@liuxspro/shapefile";

export function get_polygon_from_csv_data(csv_data: Record): Polygon {
  const keys = Object.keys(csv_data[0]);
  const points = csv_data.map((item) => {
    return [item[keys[1]], item[keys[2]]] as Point;
  });
  const polygon = Polygon.from_points(points);

  return polygon;
}

export async function create_bjwj(
  stage: "初步调查" | "详细调查",
  fields: Fields,
  multi_polygon: MultiPolygon,
  prj: string,
) {
  const filename = `${stage}${fields.DKDM}`;
  const dbf = create_dbf(fields);
  const shapefile = await Shapefile.from_polygon(
    multi_polygon.coordinates as MultiPolygonCoords,
    [],
    prj,
  );
  shapefile.dbf = dbf;
  return shapefile.to_zip(filename);
}
