import type { MultiPolygon } from "@liuxspro/libs/geo";
import { write } from "@mapbox/shp-write";

type ShpWriteResult = {
  shp: DataView;
  shx: DataView;
  dbf: DataView;
  prj: string;
};

/**
 * 根据多多边形和字段对象创建shp文件
 * @param { MultiPolygon } multi_polygon
 * @param fields
 * @returns {Promise<ShpWriteResult>}
 */
export function create_shp(
  multi_polygon: MultiPolygon,
  fields: Record<string, string> = {},
): Promise<ShpWriteResult> {
  const coords = multi_polygon.coordinates;
  return new Promise((resolve, reject) => {
    write([fields], "POLYGON", [coords], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result as ShpWriteResult);
      }
    });
  });
}
