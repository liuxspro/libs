// import { assertEquals } from "jsr:@std/assert";
import { OVMap, type OVMapOptions } from "../src/ovmap.ts";

Deno.test("ovmap", () => {
  const url =
    "https://wprd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={$x}&y={$y}&z={$z}";
  const options: OVMapOptions = {
    crs: "EPSG:3857",
    format: "JPG",
  };
  const map = new OVMap(300, "高德地图", url, options);
  console.log(map);
  console.log(map.qr_data);
});
