import { assertEquals } from "jsr:@std/assert@1";
import {
  cgcs2000_quad,
  web_mercator_quad,
  web_mercator_quad_hd,
  world_crs84_quad,
  world_crs84_quad_less,
} from "./matrix.ts";

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
