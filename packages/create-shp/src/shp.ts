import type { MultiPolygon } from "@liuxspro/libs/geo";
import { write } from "@mapbox/shp-write";
import JSZip from "jszip";

type NormalField = Record<string, string | number>;

type ShpWriteResult = {
  shp: DataView;
  shx: DataView;
  dbf: DataView;
  prj: string;
};

/**
 * 根据多多边形和字段对象创建 shp 文件
 * 已保证多多边形环方向符合 Esri 标准
 * @param { MultiPolygon } multi_polygon
 * @param fields
 * @returns {Promise<ShpWriteResult>}
 */
export function create_shp(
  multi_polygon: MultiPolygon,
  fields: NormalField = {},
): Promise<ShpWriteResult> {
  const coords = multi_polygon.ensure_esri_standard().coordinates;
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
  fields: NormalField = {},
  prj: string,
  filename: string,
): Promise<Uint8Array> {
  const shpfile = await create_shp(multi_polygon, fields);
  const zip = new JSZip();
  const zip_target = zip.folder(filename);
  zip_target?.file(`${filename}.shp`, shpfile.shp.buffer as ArrayBuffer);
  zip_target?.file(`${filename}.shx`, shpfile.shx.buffer as ArrayBuffer);
  zip_target?.file(`${filename}.dbf`, shpfile.dbf.buffer as ArrayBuffer);
  zip_target?.file(`${filename}.cpg`, "UTF-8");
  zip_target?.file(`${filename}.prj`, prj);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
