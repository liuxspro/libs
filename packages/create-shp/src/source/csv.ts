import Papa from "papaparse";
import {
  MultiPolygon,
  type Point,
  type Polygon,
  Ring,
} from "@liuxspro/libs/geo";
import { correct_points_order } from "./utils.ts";

type CSVRow = Record<string, number>;

/**
 * 读取 CSV 数据,
 * 返回 json 对象数组
 * @param {string} text csv文本内容
 * @returns {CSVRow[]} 返回 json 对象数组
 */
export function parse_csv_file_content(text: string): CSVRow[] {
  // https://www.papaparse.com/docs#csv-to-json
  const csv_parse_option = {
    skipEmptyLines: true, // 跳过空行
    header: true, // 如果CSV文件包含标题行，请设置为 true
    dynamicTyping: true, // 尝试将字段自动转换为数值类型
  };
  const csv_data = Papa.parse(text, csv_parse_option);
  return csv_data.data as CSVRow[];
}

export function get_points_from_csv_record(record: CSVRow): Point {
  // 解析每一个 csv 记录,判断是经纬度还是投影坐标系, 并调整投影坐标 X Y 的顺序
  const keys = Object.keys(record);
  if (keys.length >= 3) {
    const x = record[keys[1]];
    const y = record[keys[2]];
    let real_x;
    let real_y;
    if (x > 200) {
      //投影坐标
      return correct_points_order([x, y]);
    } else {
      real_x = x;
      real_y = y;
    }
    return [real_x, real_y];
  } else {
    throw new Error("CSV 记录字段数不足, 无法解析坐标");
  }
}

/**
 * 从所有 CSV 记录中读取点坐标信息, 一个 CSV 文件对应一个多边形
 * @param {CSVRow[]} csv_data
 * @returns {Polygon} 多边形
 */
export function get_polygon_from_csv(csv_data: CSVRow[]): Polygon {
  const points = csv_data.map((record) => get_points_from_csv_record(record));
  const ring = new Ring(points);
  return ring.to_polygon();
}

interface CSVFileParseResult {
  name: string;
  type: string;
  polygon: Polygon;
}

/**
 * 处理 Input File CSV 文件
 * @param {File} csv_file
 * @returns {Promise<CSVFileParseResult>} 文件信息和多边形对象
 */
export async function parse_csv_file(
  csv_file: File,
): Promise<CSVFileParseResult> {
  if (!csv_file.name.endsWith(".csv") && !csv_file.name.endsWith(".txt")) {
    throw new Error("仅支持 CSV 文件");
  }
  const text_data = await csv_file.text();
  const polygon = get_polygon_from_csv(parse_csv_file_content(text_data));

  return { name: csv_file.name, type: csv_file.type, polygon };
}

export function merge_ploygon(
  csv_parse_result: CSVFileParseResult[],
): MultiPolygon {
  return new MultiPolygon(csv_parse_result.map((f) => f.polygon));
}
