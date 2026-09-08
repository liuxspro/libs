import { csv_to_shp } from "../src/boundary.ts";
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

const csv2 = `
  编号,经度,纬度
  1,117.510372,34.307986
  2,117.510045,34.305752
  3,117.514722,34.305380
  4,117.514937,34.309049
  5,117.513274,34.309178
  6,117.513070,34.307738
  `;

Deno.test("create_boundary", async () => {
  const result = await csv_to_shp(csv);
  assertEquals(result.YDMJ, 130255.77);
});

Deno.test("create_boundary from csv2(逆时针环)", async () => {
  const result = await csv_to_shp(csv2);
  assertEquals(result.DH, 39);
  assertEquals(result.YDMJ, 130255.77);
});
