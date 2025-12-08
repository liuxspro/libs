import type { MultiPolygon } from "@liuxspro/libs/geo";
import { create_dbf, type Fields } from "./dbf.ts";
import JSZip from "jszip";
import { create_shp } from "./shp.ts";

/**
 * 创建边界文件 ZIP 包
 * @param stage 调查阶段 "初步调查" | "详细调查"
 * @param fields 字段信息
 * @param multi_polygon 多多边形几何对象
 * @param prj PRJ 文件内容
 * @returns {Promise<Uint8Array>} ZIP 包内容
 */
export async function create_bjwj(
  stage: "初步调查" | "详细调查",
  fields: Fields,
  multi_polygon: MultiPolygon,
  prj: string,
): Promise<Uint8Array> {
  const filename = `${stage}${fields.DKDM}`;
  const shpfile = await create_shp(multi_polygon);
  const dbf = create_dbf(fields);
  const zip = new JSZip();
  const zip_target = zip.folder(filename);
  zip_target?.file(`${filename}.shp`, shpfile.shp.buffer);
  zip_target?.file(`${filename}.shx`, shpfile.shx.buffer);
  zip_target?.file(`${filename}.dbf`, dbf.buffer);
  zip_target?.file(`${filename}.cpg`, "UTF-8");
  zip_target?.file(`${filename}.prj`, prj);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
