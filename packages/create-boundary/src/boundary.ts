import { get_cgcs2000_wkt, type MultiPolygon } from "@liuxspro/geo";
import { get_digits } from "@liuxspro/libs/utils";
import { type MultiPolygonCoords, Shapefile } from "@liuxspro/shapefile";
import { create_dbf, type Fields } from "./dbf.ts";
import { get_polygon_from_csv_data } from "./utils.ts";
import { parse_csv_content } from "./source/csv.ts";
import { round_to } from "@liuxspro/libs/utils";

interface PolygonInfo {
  YDMJ: number;
  DH: number;
  shp: Shapefile;
}

/**
 * 将 MultiPolygon 转换为 Shapefile
 * MultiPolygon 坐标为CGCS2000 投影坐标格式
 * X含带号
 */
export async function polygon_to_shp(
  polygon: MultiPolygon,
): Promise<PolygonInfo> {
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
  return {
    YDMJ: Math.abs(round_to(polygon.get_area(), 2)), // 有向面积为负，取绝对值
    DH: dh,
    shp,
  };
}

/**
 * 从 CSV 数据创建边界 Shapefile
 * @param csv CSV 数据
 * @returns 边界信息
 */
export async function csv_to_shp(csv: string): Promise<PolygonInfo> {
  const polygon = get_polygon_from_csv_data(parse_csv_content(csv));
  return await polygon_to_shp(polygon);
}

/**
 * 从 Shapefile 创建边界 ZIP 文件
 * @param stage 阶段
 * @param fields 字段
 * @param shp Shapefile
 * @returns ZIP 文件
 */
export function make_boundary_zip(
  stage: "初步调查" | "详细调查",
  fields: Fields,
  shp: Shapefile,
): Promise<Uint8Array> {
  const filename = `${stage}${fields.DKDM}`;
  shp.dbf = create_dbf(fields);
  return shp.to_zip(filename);
}
