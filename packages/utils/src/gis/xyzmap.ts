import {
  create_layer,
  create_webmercator_MatrixSet,
  crate_identification,
  create_capabilities,
} from "./wmts.ts";

export class XYZMap {
  public name: string;
  public url: string;
  public zmin: number;
  public zmax: number;
  public referer: string;

  /**
   *
   * @param name name of map
   * @param url map url like https://example.com/{z}/{x}/{y}
   * @param zmin min zoom level (default 0)
   * @param zmax max zoom level (default 18)
   * @param referer HTTP referer (default "")
   */
  constructor(
    name: string,
    url: string,
    zmin: number = 0,
    zmax: number = 18,
    referer: string = ""
  ) {
    this.name = name;
    this.url = url;
    this.zmin = zmin;
    this.zmax = zmax;
    this.referer = referer;
  }

  public info(): string {
    return `
  Name: ${this.name}
  Url : ${this.url}
  Zmin: ${this.zmin}
  Zmax: ${this.zmax}
  `;
  }
  /**
   * 作为 WMTS Layer
   * @param title Layer Title
   * @param abstract Layer Abstract. Default this.name
   * @param identifier Layer Identifier. Default this.name
   * @returns Layer xml
   */
  public as_wmts_layer(
    title: string = this.name,
    abstract: string = this.name,
    identifier: string = this.name
  ): string {
    const url_template = this.url
      .replace(/\{z\}/g, "{TileMatrix}")
      .replace(/\{x\}/g, "{TileCol}")
      .replace(/\{y\}/g, "{TileRow}")
      .replace(/&/g, "&amp;");
    return create_layer(title, abstract, identifier, url_template);
  }
  /**
   * 返回 WMTS 能力文档
   * @param title 标题. 默认为 this.name
   * @param abstract 摘要. 默认为 this.name
   * @returns 能力文档 XML
   */
  public as_wmts(
    title: string = this.name,
    abstract: string = this.name
  ): string {
    const identification = crate_identification(title, abstract);
    const matrix_set = create_webmercator_MatrixSet(this.zmin, this.zmax);
    return create_capabilities(
      identification,
      this.as_wmts_layer(),
      matrix_set
    );
  }
}
