import { assertEquals } from "jsr:@std/assert@1";
import {
  cgcs2000_quad,
  cgcs2000_quad_dpi96,
  CRS84TileMatrixSet,
  CRS84TileMatrixSetDPI96,
  generate_tile_matrixs,
  TileMatrixSetDPI96,
  web_mercator_quad,
  web_mercator_quad_dpi96,
  web_mercator_quad_hd,
  world_crs84_quad,
  world_crs84_quad_less,
} from "@liuxspro/capgen";

Deno.test("TileMatrixSet WebMercator", function () {
  const matrix = web_mercator_quad.clone();
  assertEquals(matrix.setZoom(0, 18).id, "WebMercatorQuad");
  assertEquals(matrix.setZoom(1, 18).id, "WebMercatorQuadF1T18");
  assertEquals(matrix.setZoom(2, 18).id, "WebMercatorQuadF2T18");
  assertEquals(matrix.id, "WebMercatorQuad");
  matrix.setId("NewId");
  assertEquals(matrix.id, "NewId");
  assertEquals(matrix.setZoom(2, 18).id, "NewIdF2T18");
  assertEquals(matrix.id, "NewId");
});

Deno.test("TileMatrixSet WebMercatorHD", function () {
  const matrix = web_mercator_quad_hd.clone();
  assertEquals(matrix.tile_matrixs[0].tile_width, 512);
  assertEquals(matrix.setZoom(0, 18).id, "WebMercatorQuadHd");
  assertEquals(matrix.setZoom(1, 18).id, "WebMercatorQuadHdF1T18");
  assertEquals(matrix.setZoom(2, 18).id, "WebMercatorQuadHdF2T18");
  assertEquals(matrix.id, "WebMercatorQuadHd");
  matrix.setId("NewId");
  assertEquals(matrix.id, "NewId");
  assertEquals(matrix.setZoom(2, 18).id, "NewIdF2T18");
  assertEquals(matrix.id, "NewId");
});

Deno.test("TileMatrixSet WorldCRS84Quad", function () {
  const matrix = world_crs84_quad.clone();
  const tile_matrixs = matrix.tile_matrixs;
  const level_0 = tile_matrixs[0];
  assertEquals(level_0.matrix_width / level_0.matrix_height, 2);
  assertEquals(matrix.setZoom(0, 18).id, "WorldCRS84Quad");
  assertEquals(matrix.setZoom(1, 18).id, "WorldCRS84QuadF1T18");
  assertEquals(matrix.setZoom(2, 18).id, "WorldCRS84QuadF2T18");
  assertEquals(matrix.id, "WorldCRS84Quad");
  matrix.setId("NewId");
  assertEquals(matrix.id, "NewId");
  assertEquals(matrix.setZoom(2, 18).id, "NewIdF2T18");
  assertEquals(matrix.id, "NewId");
});

Deno.test("TileMatrixSet WorldCRS84QuadLess", function () {
  const matrix = world_crs84_quad_less.clone();
  const tile_matrixs = matrix.tile_matrixs;
  const level_0 = tile_matrixs[0];
  assertEquals(level_0.matrix_width / level_0.matrix_height, 2);
  assertEquals(matrix.setZoom(0, 18).id, "WorldCRS84QuadLess");
  assertEquals(matrix.setZoom(1, 18).id, "WorldCRS84QuadLessF1T18");
  assertEquals(matrix.setZoom(2, 18).id, "WorldCRS84QuadLessF2T18");
  assertEquals(matrix.id, "WorldCRS84QuadLess");
  matrix.setId("NewId");
  assertEquals(matrix.id, "NewId");
  assertEquals(matrix.setZoom(2, 18).id, "NewIdF2T18");
  assertEquals(matrix.id, "NewId");
});

Deno.test("TileMatrixSet CGCS2000", function () {
  const matrix = cgcs2000_quad.clone();
  const tile_matrixs = matrix.tile_matrixs;
  const level_0 = tile_matrixs[0];
  assertEquals(level_0.matrix_width / level_0.matrix_height, 2);
  assertEquals(matrix.setZoom(0, 18).id, "CGCS2000Quad");
  assertEquals(matrix.setZoom(1, 18).id, "CGCS2000QuadF1T18");
  assertEquals(matrix.setZoom(2, 18).id, "CGCS2000QuadF2T18");
  assertEquals(matrix.id, "CGCS2000Quad");
  matrix.setId("NewId");
  assertEquals(matrix.id, "NewId");
  assertEquals(matrix.setZoom(2, 18).id, "NewIdF2T18");
  assertEquals(matrix.id, "NewId");
});

Deno.test("generate_tile_matrixs", function () {
  const matrixs = generate_tile_matrixs(0, 18);
  assertEquals(matrixs.length, 19);
  assertEquals(matrixs[0].identifier, "0");
  assertEquals(matrixs[18].identifier, "18");
  assertEquals(matrixs[0].scale_denominator, 559082264.0287178);
  assertEquals(matrixs[18].scale_denominator, 2132.729583849784);
});

Deno.test("generate_tile_matrixs dpi96", function () {
  const matrixs = generate_tile_matrixs(0, 18, {
    type: "3857",
    baseScale: 591658710.9091313,
  });
  assertEquals(matrixs.length, 19);
  assertEquals(matrixs[0].identifier, "0");
  assertEquals(matrixs[18].identifier, "18");
  assertEquals(matrixs[0].scale_denominator, 591658710.9091313);
  assertEquals(matrixs[18].scale_denominator, 2256.9988666882755);
});

Deno.test("CRS84TileMatrixSet", function () {
  const matrixs = new CRS84TileMatrixSet(
    "CRS84 for the World",
    "WorldCRS84Quad",
    "EPSG:4326",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
    1,
    18,
  );
  const a = matrixs.setZoom(2, 18);
  assertEquals(a.id, "WorldCRS84QuadF2T18");
  assertEquals(a.tile_matrixs[16].scale_denominator, 2132.729583849784);
  assertEquals(a.tile_matrixs[16].matrix_height, 131072);
});

Deno.test("CRS84TileMatrixSetDPI96", function () {
  // https://t0.tianditu.gov.cn/img_c/wmts?request=GetCapabilities
  const matrix = new CRS84TileMatrixSetDPI96(
    "CRS84 for the World",
    "WorldCRS84Quad",
    "EPSG:4326",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
    1,
    18,
  );
  const m = cgcs2000_quad_dpi96.clone();
  assertEquals(matrix.tile_matrixs[17].scale_denominator, 2256.9988666882755);
  assertEquals(matrix.tile_matrixs[17].matrix_height, 131072);
  assertEquals(m.tile_matrixs[17].scale_denominator, 2256.9988666882755);
});

Deno.test("TileMatrixSetDPI96", function () {
  // https://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities
  const matrix = new TileMatrixSetDPI96(
    "Google Maps Compatible for the World",
    "WebMercatorQuad",
    "EPSG:3857",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible",
    0,
    18,
  );
  const w = web_mercator_quad_dpi96.clone();
  assertEquals(matrix.tile_matrixs[18].scale_denominator, 2256.9988666882755);
  assertEquals(w.tile_matrixs[18].scale_denominator, 2256.9988666882755);
  assertEquals(matrix.tile_matrixs[18].matrix_height, 262144);
});
