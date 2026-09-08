import { create_boundary } from "../src/boundary.ts";
import { parse_csv_content } from "../src/source/csv.ts";
import { get_polygon_from_csv_data } from "../src/utils.ts";
import { assertEquals } from "jsr:@std/assert";

const csv = `
  编号,经度,纬度
  1,117.513070,34.307738
  2,117.513274,34.309178
  3,117.514937,34.309049
  4,117.514722,34.305380
  5,117.510045,34.305752
  6,117.510372,34.307986
  `;

const record = {
  "DKMC": "1",
  "DKDM": "2",
  "XZQMC": "3",
  "XZQDM": "4",
  "YDMJ": 129068.42,
  "DH": 39,
  "SCRQ": null,
  "SCDW": null,
  "BZ": null,
};

Deno.test("create_boundary", async () => {
  const polygon = get_polygon_from_csv_data(parse_csv_content(csv));
  assertEquals(polygon.first_point, [39547228.48121143, 3797916.520456376]);
  await create_boundary("初步调查", record, polygon);
});
