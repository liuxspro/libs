import { get_cgcs2000_wkt, type MultiPolygon } from "@liuxspro/geo";
import { get_digits } from "@liuxspro/libs/utils";
import { type MultiPolygonCoords, Shapefile } from "@liuxspro/shapefile";
import { create_dbf, type Fields } from "./dbf.ts";

/**
 * 将 MultiPolygon 转换为 Shapefile
 * MultiPolygon 坐标为CGCS2000 投影坐标格式
 * X含带号
 */
export async function polygon_to_shp(
  polygon: MultiPolygon,
): Promise<Shapefile> {
  const point = polygon.first_point;
  const x = point[0];
  if (get_digits(x) !== 8) {
    throw new Error(`X坐标位数不足8位: ${x}`);
  }
  const dh = parseInt(x.toString().slice(0, 2));
  const wkt = get_cgcs2000_wkt(dh);
  const shp = await Shapefile.from_polygon(
    polygon.coordinates as MultiPolygonCoords,
    [],
    wkt,
    "UTF-8",
  );
  return shp;
}

/**
 * 创建边界 Shapefile 并打包为 ZIP 文件
 * @param stage 阶段
 * @param fields 字段
 * @param multi_polygon 多多边形
 * @returns ZIP 文件
 */
export async function create_boundary(
  stage: "初步调查" | "详细调查",
  fields: Fields,
  multi_polygon: MultiPolygon,
): Promise<Uint8Array> {
  const filename = `${stage}${fields.DKDM}`;
  const dbf = create_dbf(fields);
  const shp = await polygon_to_shp(multi_polygon);
  shp.dbf = dbf;
  const zip = await shp.to_zip(filename);
  return zip;
}
