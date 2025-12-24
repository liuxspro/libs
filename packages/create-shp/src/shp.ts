import type { MultiPolygon } from "@liuxspro/libs/geo";
import { write } from "@mapbox/shp-write";
import JSZip from "jszip";

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
  fields: Record<string, string | number> = {},
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

export async function create_shp_zip(
  multi_polygon: MultiPolygon,
  fields: Record<string, string | number> = {},
  prj: string,
  filename: string,
): Promise<Uint8Array> {
  const shpfile = await create_shp(multi_polygon, fields);
  const zip = new JSZip();
  const zip_target = zip.folder(filename);
  zip_target?.file(`${filename}.shp`, shpfile.shp.buffer);
  zip_target?.file(`${filename}.shx`, shpfile.shx.buffer);
  zip_target?.file(`${filename}.dbf`, shpfile.dbf.buffer);
  zip_target?.file(`${filename}.cpg`, "UTF-8");
  zip_target?.file(`${filename}.prj`, prj);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
