import type { BBox, Service } from "./cangen.ts";
import {
  CRS84LessTileMatrixSet,
  CRS84TileMatrixSet,
  CRS84TileMatrixSetDPI96,
  TileMatrixSet,
  TileMatrixSetDPI96,
  TileMatrixSetHd,
} from "./matrix.ts";

export const default_service: Service = {
  title: "Simple WMTS",
  abstract: "Simple WMTS",
  keywords: ["WMTS"],
};

export const mercator_bbox: BBox = [
  [-180.0, -85.051129], // 西南角 (LowerCorner)
  [180.0, 85.051129], // 东北角 (UpperCorner)
];

export const world_mercator_bbox: BBox = [
  [-180.0, -85.08405903], // 西南角 (LowerCorner)
  [180.0, 85.08405903], // 东北角 (UpperCorner)
];

// 常用瓦片矩阵集
// WebMercator (256px)
// https://docs.ogc.org/is/17-083r2/17-083r2.html#73
export const web_mercator_quad: TileMatrixSet = new TileMatrixSet(
  "Google Maps Compatible for the World",
  "WebMercatorQuad",
  "EPSG:3857",
  "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible",
  0,
  18,
);

export const web_mercator_quad_dpi96: TileMatrixSetDPI96 =
  new TileMatrixSetDPI96(
    "Google Maps Compatible for the World",
    "WebMercatorQuadDPI96",
    "EPSG:3857",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible",
    0,
    18,
  );

// web_mercator_quad (512px)
export const web_mercator_quad_hd: TileMatrixSetHd = new TileMatrixSetHd(
  "Google Maps Compatible for the World",
  "WebMercatorQuadHd",
  "EPSG:3857",
  "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible",
  0,
  18,
);

// https://docs.ogc.org/is/17-083r2/17-083r2.html#76
// 此处使用了 EPSG:4326 变体
export const world_crs84_quad: CRS84TileMatrixSet = new CRS84TileMatrixSet(
  "CRS84 for the World",
  "WorldCRS84Quad",
  "EPSG:4326",
  "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
  1,
  18,
);

export const world_crs84_quad_dpi96: CRS84TileMatrixSetDPI96 =
  new CRS84TileMatrixSetDPI96(
    "CRS84 for the World",
    "WorldCRS84QuadDPI96",
    "EPSG:4326",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
    1,
    18,
  );

// 比正常的 4326 瓦片层级少 1
export const world_crs84_quad_less: CRS84LessTileMatrixSet =
  new CRS84LessTileMatrixSet(
    "CRS84 for the World",
    "WorldCRS84QuadLess",
    "EPSG:4326",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
    1,
    18,
  );

// 与 EPSG:4326 基本一样
export const cgcs2000_quad: CRS84TileMatrixSet = new CRS84TileMatrixSet(
  "CRS84 for the World",
  "CGCS2000Quad",
  "EPSG:4490",
  "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
  1,
  18,
);

export const cgcs2000_quad_dpi96: CRS84TileMatrixSetDPI96 =
  new CRS84TileMatrixSetDPI96(
    "CRS84 for the World",
    "CGCS2000QuadDPI96",
    "EPSG:4490",
    "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad",
    1,
    18,
  );

// EPSG:3395
// See https://docs.ogc.org/is/17-083r4/17-083r4.html#toc51
export const world_mercator_quad: TileMatrixSet = new TileMatrixSet(
  "CRS84 for the World",
  "WorldMercatorWGS84Quad",
  "EPSG:3395",
  "http://www.opengis.net/def/wkss/OGC/1.0/WorldMercatorWGS84",
  0,
  18,
);
