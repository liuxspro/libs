import { create_boundary_from_csv } from "../src/boundary.ts";
// import { assertEquals } from "jsr:@std/assert";

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
  await create_boundary_from_csv("初步调查", record, csv);
});
