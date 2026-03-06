import { assertEquals } from "jsr:@std/assert@1";
import { web_mercator_quad } from "./matrix.ts";

Deno.test("TileMatrixSet", function () {
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

Deno.test("TileMatrixSet Clone", function () {
  const matrix = web_mercator_quad.clone();
  const matrix_clone = matrix.clone();
  assertEquals(matrix_clone.id, matrix.id);
  assertEquals(matrix_clone.setZoom(2, 7).id, `${matrix.id}F2T7`);
  assertEquals(matrix.id, "WebMercatorQuad");
});
