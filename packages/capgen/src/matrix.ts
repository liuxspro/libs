import { cloneDeep } from "es-toolkit";

export interface TileMatrix {
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

type Constructor = new (
  title: string,
  id: string,
  supported_crs: string,
  wellknown_scale_set: string,
  min_zoom: number,
  max_zoom: number,
) => TileMatrixSet;

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
    this.tile_matrixs = this.generateMatrixs(this.min_zoom, this.max_zoom);
  }

  /**
   * Updates the zoom level range and regenerates tile matrices
   * @param {number} min_zoom - New minimum zoom level
   * @param {number} max_zoom - New maximum zoom level
   * @returns {TileMatrixSet} Returns a new TileMatrixSet instance with updated zoom levels and tile matrices
   */
  setZoom(min_zoom: number, max_zoom: number): this {
    const newId = min_zoom !== 0 || max_zoom !== 18
      ? `${this.id}F${min_zoom}T${max_zoom}`
      : this.id;
    return new (this.constructor as Constructor)(
      this.title,
      newId,
      this.supported_crs,
      this.wellknown_scale_set,
      min_zoom,
      max_zoom,
    ) as this;
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

  protected generateMatrixs(
    min: number,
    max: number,
    config: MatrixConfig = { type: "3857" },
  ): TileMatrix[] {
    return generate_tile_matrixs(min, max, config);
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

export class CRS84TileMatrixSetDPI96 extends CRS84TileMatrixSet {
  constructor(
    title: string,
    id: string,
    supported_crs: string,
    wellknown_scale_set: string,
    min_zoom: number,
    max_zoom: number,
  ) {
    super(title, id, supported_crs, wellknown_scale_set, min_zoom, max_zoom);
  }
  protected override generateMatrixs(min: number, max: number): TileMatrix[] {
    return generate_tile_matrixs(min, max, {
      "type": "4326",
      baseScale: 591658710.9091313,
    });
  }
}

export class TileMatrixSetDPI96 extends TileMatrixSet {
  constructor(
    title: string,
    id: string,
    supported_crs: string,
    wellknown_scale_set: string,
    min_zoom: number,
    max_zoom: number,
  ) {
    super(title, id, supported_crs, wellknown_scale_set, min_zoom, max_zoom);
  }
  protected override generateMatrixs(min: number, max: number): TileMatrix[] {
    return generate_tile_matrixs(min, max, {
      "type": "3857",
      baseScale: 591658710.9091313,
    });
  }
}
