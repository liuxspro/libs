import { assertEquals } from "jsr:@std/assert";
import { get_kmldata_from_kmz } from "../src/source/kml.ts";

Deno.test("read kml from kmz", async function () {
  const kmz = Deno.readFileSync("./tests/demo.kmz");
  const kml_data = await get_kmldata_from_kmz(kmz.buffer);
  assertEquals(kml_data.includes("kml"), true);
});
