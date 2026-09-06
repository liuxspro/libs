import { type CsvObjectsResult, parseCsvObjects } from "hucre/csv";

export type Record = CsvObjectsResult["data"];

/**
 * return {Record}
 * [{ "编号": 1, "经度": 117.51307, "纬度": 34.307738 },]
 */
export function parse_csv_content(csvString: string): Record {
  const { data } = parseCsvObjects(
    csvString.trim(),
    { header: true, typeInference: true },
  );
  return data;
}
