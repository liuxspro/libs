import { assertEquals } from "jsr:@std/assert";

import {
  get_polygon_from_csv,
  parse_csv_file,
  parse_csv_file_content,
} from "../src/source/csv.ts";
import { join } from "jsr:@std/path";
const csv_dir = join(Deno.cwd(), "tests/data/csv");

Deno.test("parse_csv_file_content", function () {
  for (const dir_entry of Deno.readDirSync(csv_dir)) {
    if (dir_entry.isFile && dir_entry.name.endsWith(".csv")) {
      const file_path = join(csv_dir, dir_entry.name);
      const text = Deno.readTextFileSync(file_path);
      const csv_data = parse_csv_file_content(text);
      const polygon = get_polygon_from_csv(csv_data);
      assertEquals(polygon.coordinates.length > 0, true);
      // console.log(
      //   `测试文件: ${dir_entry.name} - [${polygon.coordinates[0][0]}]`,
      // );
    }
  }
});

Deno.test("parse_csv_file", async function () {
  for (const dir_entry of Deno.readDirSync(csv_dir)) {
    if (dir_entry.isFile && dir_entry.name.endsWith(".csv")) {
      const file_path = join(csv_dir, dir_entry.name);
      const text = Deno.readTextFileSync(file_path);
      const file = new File([text], dir_entry.name, { type: "text/csv" });
      const result = await parse_csv_file(file);
      const polygon = result.polygon;
      assertEquals(polygon.coordinates.length > 0, true);
    }
  }
});
