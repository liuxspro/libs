import { join } from "jsr:@std/path";
import { parse_csv_content } from "../src/source/csv.ts";
import { get_polygon_from_csv_data } from "../src/utils.ts";
import { assertEquals, assertThrows } from "jsr:@std/assert";

const dirname = import.meta.dirname;
let csv_dir: string;
if (dirname) {
  csv_dir = join(dirname, "data/csv");
}

Deno.test("CSV: get_polygon_from_csv_data", function () {
  for (const dir_entry of Deno.readDirSync(csv_dir)) {
    if (dir_entry.isFile && dir_entry.name.endsWith(".csv")) {
      const file_path = join(csv_dir, dir_entry.name);
      const text = Deno.readTextFileSync(file_path);
      const csv_data = parse_csv_content(text);
      // 缺失带号报错
      if (file_path.includes("无带号")) {
        assertThrows(
          () => get_polygon_from_csv_data(csv_data),
          Error,
          "X 缺失带号",
        );
        continue;
      }
      const polygon = get_polygon_from_csv_data(csv_data);
      const x = polygon.first_point[0];
      const y = polygon.first_point[1];
      assertEquals(typeof x, "number");
      assertEquals(Math.round(x).toString().length, 8);
      assertEquals(typeof y, "number");
    }
  }
});
