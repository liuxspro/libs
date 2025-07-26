import { cloneDeep } from "@es-toolkit/es-toolkit";

interface TileMatrix {
  identifier: string;
  scale_denominator: number;
  top_left_corner: [number, number];
  tile_width: number;
  tile_height: number;
  matrix_width: number;
  matrix_height: number;
}

type MatrixConfig = {
  type: "3857" | "4326";
  tileSize?: number; // 瓦片尺寸（默认256）
  baseScale?: number; // 可选自定义基准比例
  hdMode?: boolean; // 是否HD模式（自动调整基准比例）
};

export function generate_tile_matrixs(
  minZoom: number,
  maxZoom: number,
  config: MatrixConfig = { type: "3857" },
): TileMatrix[] {
  if (!Number.isInteger(minZoom) || !Number.isInteger(maxZoom)) {
    throw new Error("Zoom levels must be integers");
  }

  const tileSize = config.tileSize || 256;
  let baseScale = config.baseScale ?? 559_082_264.028_7178;

  // HD模式自动调整基准比例
  if (config.hdMode && !config.baseScale) {
    baseScale /= 2;
  }

  return Array.from({ length: maxZoom - minZoom + 1 }, (_, index) => {
    const zoom = minZoom + index;
    const scale = baseScale / Math.pow(2, zoom);
    const matrixWidth = Math.pow(2, zoom);

    // CRS特定配置
    const isCRS4326 = config.type === "4326";
    const matrixHeight = isCRS4326 ? matrixWidth / 2 : matrixWidth;
    const topLeftCorner: [number, number] = isCRS4326
      ? [90, -180] // EPSG:4326
      : [-20037508.3427892, 20037508.3427892]; // EPSG:3857

    return {
      identifier: zoom.toString(),
      scale_denominator: Number(scale),
      top_left_corner: topLeftCorner,
      tile_width: tileSize,
      tile_height: tileSize,
      matrix_width: matrixWidth,
      matrix_height: matrixHeight,
    };
  });
}

export class TileMatrixSet {
  public tile_matrixs: TileMatrix[];
  /**
   * Creates a new TileMatrixSet instance
   * @param {string} title - Human-readable title of the tile matrix set
   * @param {string} id - Unique identifier for the tile matrix set
   * @param {string} supported_crs - Supported coordinate reference system
   * @param {string} wellknown_scale_set - Identifier for the well-known scale set
   * @param {number} min_zoom - Minimum zoom level (inclusive, non-negative)
   * @param {number} max_zoom - Maximum zoom level (inclusive, must be >= min_zoom)
   */
  constructor(
    public title: string,
    public id: string,
    public supported_crs: string,
    public wellknown_scale_set: string,
    public min_zoom: number,
    public max_zoom: number,
  ) {
    this.tile_matrixs = generate_tile_matrixs(this.min_zoom, this.max_zoom, {
      type: "3857",
    });
  }

  /**
   * Updates the zoom level range and regenerates tile matrices
   * @param {number} min_zoom - New minimum zoom level
   * @param {number} max_zoom - New maximum zoom level
   * @returns {this} Returns the instance for method chaining
   */
  setZoom(min_zoom: number, max_zoom: number): this {
    this.min_zoom = min_zoom;
    this.max_zoom = max_zoom;
    this.tile_matrixs = this.generateMatrixs(min_zoom, max_zoom);
    if (min_zoom != 0 || max_zoom != 18) {
      this.setId(`${this.id}F${min_zoom}T${max_zoom}`);
    }
    return this;
  }
  /**
   * Set identifier of tilematrix set
   * @param {string} id identifier of tilematrix set
   * @returns {this} Returns the instance for method chaining
   */
  setId(id: string): this {
    this.id = id;
    return this;
  }

  protected generateMatrixs(min: number, max: number): TileMatrix[] {
    return generate_tile_matrixs(min, max);
  }

  clone(): this {
    return cloneDeep(this);
  }
}

export class TileMatrixSetHd extends TileMatrixSet {
  constructor(
    title: string,
    id: string,
    supported_crs: string,
    wellknown_scale_set: string,
    min_zoom: number,
    max_zoom: number,
  ) {
    super(title, id, supported_crs, wellknown_scale_set, min_zoom, max_zoom);
    this.tile_matrixs = this.generateMatrixs(min_zoom, max_zoom);
  }

  protected override generateMatrixs(min: number, max: number): TileMatrix[] {
    return generate_tile_matrixs(min, max, {
      "type": "3857",
      tileSize: 512,
      hdMode: true,
    });
  }
}

export class CRS84TileMatrixSet extends TileMatrixSet {
  constructor(
    title: string,
    id: string,
    supported_crs: string,
    wellknown_scale_set: string,
    min_zoom: number,
    max_zoom: number,
  ) {
    super(title, id, supported_crs, wellknown_scale_set, min_zoom, max_zoom);
    this.tile_matrixs = this.generateMatrixs(min_zoom, max_zoom);
  }

  protected override generateMatrixs(min: number, max: number): TileMatrix[] {
    return generate_tile_matrixs(min, max, { "type": "4326" });
  }
}

export class CRS84LessTileMatrixSet extends CRS84TileMatrixSet {
  constructor(
    title: string,
    id: string,
    supported_crs: string,
    wellknown_scale_set: string,
    min_zoom: number,
    max_zoom: number,
  ) {
    super(title, id, supported_crs, wellknown_scale_set, min_zoom, max_zoom);
    this.tile_matrixs = this.generateMatrixs(min_zoom, max_zoom);
  }
  protected override generateMatrixs(min: number, max: number): TileMatrix[] {
    const matrix = generate_tile_matrixs(min, max, { "type": "4326" });
    const matrix_less = matrix.map((t) => {
      const n = t.identifier;
      const less = parseInt(n) - 1;
      t.identifier = String(less);
      return t;
    });
    return matrix_less;
  }
}

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
