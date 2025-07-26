import { Environment } from "minijinja-js";
import { template } from "./template.ts";
import type { TileMatrixSet } from "./matrix.ts";

export interface Service {
  title: string;
  abstract: string;
  keywords: string[];
}

export type GeoPoint = { lon: number; lat: number };

export const default_service: Service = {
  title: "Simple WMTS",
  abstract: "Simple WMTS",
  keywords: ["WMTS"],
};

export const mercator_bbox: [GeoPoint, GeoPoint] = [
  { lon: -180.0, lat: -85.051129 }, // 西南角 (LowerCorner)
  { lon: 180.0, lat: 85.051129 }, // 东北角 (UpperCorner)
];

export const world_mercator_bbox: [GeoPoint, GeoPoint] = [
  { lon: -180.0, lat: -85.08405903 }, // 西南角 (LowerCorner)
  { lon: 180.0, lat: 85.08405903 }, // 东北角 (UpperCorner)
];

export class MapLayer {
  wmts_url: string;
  tile_matrix_set: string;
  /**
   * @param title 地图名称
   * @param abstract 摘要
   * @param id 唯一id
   * @param bbox 边界框
   * @param tile_matrix_set 瓦片矩阵集
   * @param url 原始的url 包含{z}/{x}/{y}
   */
  constructor(
    public title: string,
    public abstract: string,
    public id: string,
    public bbox: [GeoPoint, GeoPoint],
    public matrix: TileMatrixSet,
    public url: string,
    public format?: string,
  ) {
    this.wmts_url = this.trans_url(url);
    this.tile_matrix_set = this.matrix.id;
  }

  set_title(title: string) {
    this.title = title;
  }

  set_url(new_url: string) {
    this.url = this.trans_url(new_url);
  }

  set_token(tk_name: string = "tk", token: string) {
    // Add new token parameter
    this.wmts_url = this.trans_url(this.url + `&${tk_name}=${token}`);
  }

  protected trans_url(url: string): string {
    return url
      .replace(/\{z\}/g, "{TileMatrix}")
      .replace(/\{x\}/g, "{TileCol}")
      .replace(/\{y\}/g, "{TileRow}")
      .replace(/&/g, "&amp;")
      .replace(/\|/g, "%7C");
  }
}

export class Capabilities {
  constructor(public service: Service, public layers: MapLayer[]) {
  }

  get xml(): string {
    const env = new Environment();
    env.trimBlocks = true;
    env.lstripBlocks = true;
    env.debug = true;
    const service = this.service;
    const layers = this.layers;

    const used_matrix = layers.map((layer) => {
      return layer.matrix;
    });

    const unique_matrix_map = new Map();
    used_matrix.forEach((item) => unique_matrix_map.set(item.id, item));
    const tile_matrix_sets = Array.from(unique_matrix_map.values());

    const result = env.renderStr(template, {
      service,
      layers,
      tile_matrix_sets,
    });

    return result;
  }
}
