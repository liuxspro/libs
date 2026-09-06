import { join } from "jsr:@std/path";
const csv_dir = join(Deno.cwd(), "tests/data/csv");
import { parse_csv_content } from "../src/source/csv.ts";
import { get_polygon_from_csv_data } from "../src/utils.ts";
import { assertInstanceOf } from "jsr:@std/assert";
import { Polygon } from "@liuxspro/geo";

Deno.test("CSV: get_polygon_from_csv_data", function () {
  for (const dir_entry of Deno.readDirSync(csv_dir)) {
    if (dir_entry.isFile && dir_entry.name.endsWith(".csv")) {
      const file_path = join(csv_dir, dir_entry.name);
      const text = Deno.readTextFileSync(file_path);
      const csv_data = parse_csv_content(text);
      const polygon = get_polygon_from_csv_data(csv_data);
      assertInstanceOf(polygon, Polygon);
    }
  }
});
