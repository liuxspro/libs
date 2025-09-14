import { encode } from "./base64.ts";

// ov base64 编码函数
// 移除"=" | 替换'/'为'-' | 替换'+'为'_'
const ov_encode = (str: string): string => {
  const encoded = encode(str);
  return encoded.replace(/=/g, "").replace(/\//g, "-").replace(/\+/g, "_");
};

export interface OVMapOptions {
  /**
   * 分组名称
   * 对应参数 gp
   */
  group?: string;

  /**
   * 地图投影类型
   * 对应参数 pn
   * pn = 0 或未设置 - `'EPSG:3857'`: Web Mercator (墨卡托全球) - 默认值
   * pn = 1 - `'GCJ02'`: GCJ02 (墨卡托中国)
   * pn = 2- `'EPSG:4326'`: WGS84 (经纬度投影)
   */
  crs?: "EPSG:3857" | "GCJ02" | "EPSG:4326";

  /**
   * 瓦片大小 256px或 512px
   * 对应参数 ms
   * ms = 256(默认 可不提供此参数)
   * ms = 512
   */
  size?: 256 | 512;
  /**
   * 子域名起始值
   * 对应参数 hs
   */

  subdomain_start?: number;

  /**
   * 子域名结束值
   * 对应参数 he
   */
  subdomain_end?: number;

  /**
   * 瓦片图像格式
   * 对应参数 mf
   * 未设置时，默认为 PNG 格式
   * `mf=3` 表示 JPG 格式
   */
  format?: "PNG" | "JPG";
}

export class OVMap {
  id: number;
  name: string;
  url: URL;
  crs: "EPSG:3857" | "GCJ02" | "EPSG:4326";
  size: 256 | 512;
  subdomain_start: number;
  subdomain_end: number;
  host: string;
  path: string;
  protocol: string;
  port: string;
  options: OVMapOptions;

  constructor(
    id: number,
    name: string,
    url: URL | string,
    options: OVMapOptions = {},
  ) {
    this.id = id;
    this.name = name;
    this.url = typeof url === "string" ? new URL(url) : url;
    this.options = options;
    // 设置选项和默认值
    this.crs = options.crs ?? "EPSG:3857";
    this.size = options.size ?? 256;
    this.subdomain_start = options.subdomain_start ?? 0;
    this.subdomain_end = options.subdomain_end ?? 0;

    // 根据 URL 提取主机、路径、协议等信息
    this.host = this.url.hostname || "";
    this.path = (this.url.pathname || "") + (this.url.search || "");
    this.protocol = (this.url.protocol || "https").replace(":", "");
    // 猜测端口
    const gussing_port = this.protocol === "https" ? "443" : "80";
    this.port = this.url.port || gussing_port;
  }

  get qr_data() {
    const params = new URLSearchParams();
    params.set("t", "37");
    params.set("id", `${this.id}`);
    params.set("na", ov_encode(this.name));
    params.set("hn", ov_encode(this.host));
    params.set("ul", ov_encode(this.path));
    params.set("pt", this.port);
    params.set("po", "1");
    if (this.protocol === "http") {
      params.set("po", "0");
    }

    // 分组名称
    if (this.options.group) {
      params.set("gp", ov_encode(this.options.group));
    }

    // 瓦片尺寸 默认256px可不提供此参数
    if (this.options.size === 512) {
      params.set("ms", "512");
    }

    // 瓦片图像格式 默认PNG可不提供此参数
    if (this.options.format === "JPG") {
      params.set("mf", "3");
    }

    if (this.options.subdomain_start) {
      params.set("hs", this.options.subdomain_start.toString());
    }
    if (this.options.subdomain_end) {
      params.set("hs", this.options.subdomain_end.toString());
    }

    const crs_value = {
      "EPSG:3857": "0",
      "GCJ02": "1",
      "EPSG:4326": "2",
    };
    params.set("pn", crs_value[this.crs]);

    return `ovobj?${params.toString()}`;
  }
}
