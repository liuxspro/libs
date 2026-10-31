import { type CsvObjectsResult, parseCsvObjects } from "hucre/csv";

export type Record = CsvObjectsResult["data"];

// https://github.com/productdevbook/hucre

/** 常见的字段分隔符（从 Word 表格复制通常是制表符） */
const DELIMITERS = ["\t", ",", ";", "|"] as const;

/**
 * 从一行文本推断分隔符
 *
 * 优先取出现次数最多的显式分隔符；都没有时退化为连续空白，
 * 但要求能切出至少 3 列，避免把普通文本误判为表格。
 */
function detect_separator(line: string): string | RegExp | null {
  let best: string | RegExp | null = null;
  let best_count = 0;
  for (const separator of DELIMITERS) {
    const count = line.split(separator).length - 1;
    if (count > best_count) {
      best = separator;
      best_count = count;
    }
  }
  if (best_count > 0) {
    return best;
  }
  return line.trim().split(/\s+/).length >= 3 ? /\s+/ : null;
}

/** 非逗号分隔时统一重写为逗号分隔，保持后续解析只有一种方言 */
function normalize_separator(text: string): string {
  const lines = text.split(/\r?\n/);
  const first = lines.find((line) => line.trim() !== "");
  if (!first) {
    return text;
  }
  const separator = detect_separator(first);
  if (!separator || separator === ",") {
    return text;
  }
  return lines
    .map((line) =>
      line.trim() === ""
        ? ""
        : line.split(separator).map((cell) => cell.trim()).join(",")
    )
    .join("\n");
}

function is_number(cell: string | undefined): boolean {
  const value = cell?.trim() ?? "";
  return value !== "" && Number.isFinite(Number(value));
}

/**
 * 首行看起来是数据（第 2、3 列都是数字）时补一行表头
 *
 * 列名不重要，解析按列位置取值；补出来的表头只是让 CSV 解析器正常工作。
 */
function ensure_header(text: string): string {
  const first = text.split("\n").find((line) => line.trim() !== "");
  if (!first) {
    return text;
  }
  const cells = first.split(",");
  if (cells.length < 3 || !is_number(cells[1]) || !is_number(cells[2])) {
    return text;
  }
  const header = cells
    .map((_, index) => {
      if (index === 0) return "编号";
      if (index === 1) return "X";
      if (index === 2) return "Y";
      return `列${index + 1}`;
    })
    .join(",");
  return `${header}\n${text}`;
}

/**
 * 解析 CSV 文本
 *
 * - 支持逗号、制表符、分号、竖线，以及连续空白作为分隔符（Word 表格复制）
 * - 首行可以是标题行，也可以直接是数据行（自动补表头）
 * - 自动去除 UTF-8 BOM
 *
 * @example
 * return {Record}
 * [{ "编号": 1, "经度": 117.51307, "纬度": 34.307738 },]
 */
export function parse_csv_content(csvString: string): Record {
  const cleaned = csvString.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return [];
  }
  const normalized = ensure_header(normalize_separator(cleaned));
  const { data } = parseCsvObjects(
    normalized,
    { header: true, typeInference: true, delimiter: "," },
  );
  return data;
}
