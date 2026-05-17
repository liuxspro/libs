import { assertEquals } from "jsr:@std/assert@1";

import {
  Capabilities,
  default_service,
  MapLayer,
  mercator_bbox,
  web_mercator_quad,
} from "@liuxspro/capgen";

const debug_layer = new MapLayer(
  "测试瓦片 EPSG:3857",
  "显示图块的行列号",
  "debug3857",
  mercator_bbox,
  web_mercator_quad.clone(),
  "https://service.liuxs.pro/tile/debug/{z}/{x}/{y}",
  "image/png",
);

const debug = new Capabilities(
  default_service,
  [debug_layer],
).xml;

Deno.test("Capabilities Generate", function () {
  assertEquals(debug.includes("-180 -85.051129"), true);
  assertEquals(debug.includes("180 85.051129"), true);
  assertEquals(debug.includes("debug3857"), true);
});
