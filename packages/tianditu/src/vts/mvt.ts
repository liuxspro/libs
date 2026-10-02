/**
 * 天地图 vts 接口矢量瓦片 -> 标准 MVT。
 *
 * vts 接口的响应是天地图私有的 TVT 格式，相对标准 MVT 只有两层变形：
 *
 *   1. tile 字节混淆：对整个 tile 的下标 `[1, 2, 3, 4, 99]` 逐字节取反（自逆运算）
 *   2. 私有 protobuf：Layer/Feature/Value 的字段号与标准 MVT 互换，几何命令也不同
 *
 * 于是整条链路只有两步：去混淆 -> 解析 -> 重编码。
 *
 * ```ts
 * import { vts_tile_to_standard_mvt } from "@liuxspro/tianditu/vts";
 *
 * const mvt: Uint8Array = vts_tile_to_standard_mvt(vts_response_bytes);
 * ```
 *
 * 注意：天地图另一个接口 tvt 的载荷在上述两层之外还多一层「SHA256 密钥流异或」
 * （密钥由自带的 32B 前缀 + 4B salt 派生）。vts 没有这一层，所以这里不做、
 * 也不会去做密文试探 —— 拿到密文会直接报错并说明原因。
 *
 * tvt 那条路见 `../tvt/`：解掉密文之后的明文与 vts 的载荷是同一种东西，
 * 所以解析/重编码全部复用本模块（`parse_tvt_payload` 就是两者共用的那一层）。
 *
 * 算法取自官方在线地图 https://map.tianditu.gov.cn/static/js/main.*.js
 */

// ---------- 常量 ----------

/** tile 级字节混淆涉及的下标。tdt.js: ZC 构造函数 */
export const TILE_FLIP_INDEXES = [1, 2, 3, 4, 0x63];

/**
 * 私有 schema 的类型号 -> 标准 MVT 类型号（1=Point, 2=LineString, 3=Polygon）。
 *
 * 名字沿用 tdt.js 里那个拼错的 `encrpt`，便于和反推来源对上。
 */
export const ENCRPT_TYPE: Record<number, number> = { 0: 0, 1: 2, 2: 3, 4: 1 };

/** 标准 MVT 类型号 -> 名字 */
export const TYPE_NAME = ["Unknown", "Point", "LineString", "Polygon"];

// ---------- 类型 ----------

/** 瓦片内的局部坐标，范围是 `[0, extent]` */
export type Point = { x: number; y: number };

/** 属性值的 protobuf 类型 */
export type ValueKind =
  | "string"
  | "float"
  | "double"
  | "int"
  | "uint"
  | "sint"
  | "bool";

export interface Value {
  kind: ValueKind;
  value: string | number | boolean | null;
}

export interface Feature {
  id?: number;
  /** 标准 MVT 类型号（1=Point, 2=LineString, 3=Polygon） */
  type: number;
  /** 原始 tags：`[key_idx, value_idx, key_idx, value_idx, ...]` */
  tags: number[];
  /** 按 `keys`/`values` 展开后的属性 */
  properties: Record<string, string | number | boolean | null>;
  geometry: Point[][];
}

export interface Layer {
  name: string | null;
  version: number;
  extent: number;
  keys: string[];
  values: Value[];
  features: Feature[];
}

export interface TileStats {
  layers: Layer[];
  /** 顶层解析实际消耗的字节数；正常应等于输入长度（即分帧完整） */
  consumed: number;
}

/** vts 瓦片解析结果 */
export interface VtsTile extends TileStats {
  /** 去掉字节混淆后、字段结构合法的 TVT protobuf */
  tile: Uint8Array;
}

// ---------- protobuf 字节流读取器 ----------

/** tdt.js: F_（protobuf 读取器） */
export class Pbf {
  pos = 0;
  length: number;
  private dv: DataView;
  constructor(public buf: Uint8Array) {
    this.length = buf.length;
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  /**
   * 确保接下来 n 个字节可读，否则抛错。
   *
   * 没有这个检查时，`this.buf[this.pos++]` 越界会返回 `undefined`，而
   * `undefined < 0x80` 恒为 false —— `read_varint` 的 `while (true)` 就永远退不出来，
   * 一块被截断的瓦片足以把整个进程吊死。
   */
  private need(n: number) {
    if (this.pos + n > this.length) {
      throw new Error(
        `瓦片字节不足: 需要 ${n}B, 位置 ${this.pos}/${this.length}`,
      );
    }
  }
  read_varint(): number {
    this.need(1);
    let b = this.buf[this.pos++];
    if (b < 0x80) return b;
    let r = b & 0x7f, shift = 7;
    while (true) {
      this.need(1);
      b = this.buf[this.pos++];
      r += (b & 0x7f) * 2 ** shift;
      if (b < 0x80) return r;
      shift += 7;
    }
  }
  read_svarint(): number {
    const v = this.read_varint();
    return v % 2 === 1 ? (v + 1) / -2 : v / 2;
  }
  read_boolean(): boolean {
    return !!this.read_varint();
  }
  read_float(): number {
    this.need(4);
    const v = this.dv.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }
  read_double(): number {
    this.need(8);
    const v = this.dv.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  }
  read_string(): string {
    const end = this.read_varint() + this.pos;
    if (end > this.length) {
      throw new Error(`字符串越界: ${this.pos}..${end} / 共 ${this.length}B`);
    }
    const s = new TextDecoder().decode(this.buf.subarray(this.pos, end));
    this.pos = end;
    return s;
  }
  skip(wire: number) {
    if (wire === 0) this.read_varint(); // 等价于吞掉整个 varint，但会检查越界
    else if (wire === 1) {
      this.need(8);
      this.pos += 8;
    } else if (wire === 2) {
      // 注意：不能写 pos += read_varint() —— 会先取旧 pos，再加新 pos
      const len = this.read_varint();
      this.need(len);
      this.pos += len;
    } else if (wire === 5) {
      this.need(4);
      this.pos += 4;
    } else throw new Error(`Unimplemented type: ${wire} @${this.pos}`);
  }
  /**
   * 复刻 F_.readFields/nextField：回调只消费认识的字段，
   * 未消费的值在下一轮用记录的 wire 懒跳过。
   */
  fields(cb: (field: number, pbf: Pbf) => void, end = this.length) {
    let wire = 0, value_start = -1;
    while (true) {
      if (this.pos === value_start) this.skip(wire);
      if (this.pos >= end) return;
      const tag = this.read_varint();
      wire = tag & 7;
      value_start = this.pos;
      cb(Math.floor(tag / 8), this);
    }
  }
}

// ---------- tile 字节去混淆 ----------

/** 对整个 tile 的下标 `[1, 2, 3, 4, 99]` 逐字节取反。tdt.js: ZC 构造函数 */
export function deobfuscate_tile(dec: Uint8Array): Uint8Array {
  const tile = dec.slice();
  for (const i of TILE_FLIP_INDEXES) {
    if (i >= 0 && i < tile.length) tile[i] = ~tile[i] & 255;
  }
  return tile;
}

// ---------- TVT 私有 schema（vts 与 tvt 共用） ----------

/** tdt.js: XC — 1=string, 3=float, 2=double, 4=uint, 5=uint, 6=sint, 7=bool */
function read_tvt_value(pbf: Pbf): Value {
  const end = pbf.read_varint() + pbf.pos;
  let v: Value = { kind: "string", value: null };
  pbf.fields((f, p) => {
    if (f === 1) v = { kind: "string", value: p.read_string() };
    else if (f === 3) v = { kind: "float", value: p.read_float() };
    else if (f === 2) v = { kind: "double", value: p.read_double() };
    else if (f === 4) v = { kind: "int", value: p.read_varint() };
    else if (f === 5) v = { kind: "uint", value: p.read_varint() };
    else if (f === 6) v = { kind: "sint", value: p.read_svarint() };
    else if (f === 7) v = { kind: "bool", value: p.read_boolean() };
  }, end);
  return v;
}

/** tdt.js: UC.loadGeometry, encrpt=true — MoveTo=2, LineTo=3, ClosePath=7 */
function load_tvt_geometry(pbf: Pbf, geom_pos: number): Point[][] {
  pbf.pos = geom_pos;
  const end = pbf.read_varint() + pbf.pos;
  let cmd = 1, len = 0, x = 0, y = 0;
  const rings: Point[][] = [];
  let ring: Point[] | undefined;
  while (pbf.pos < end) {
    if (len <= 0) {
      const c = pbf.read_varint();
      cmd = c & 7;
      len = Math.floor(c / 8);
    }
    len--;
    if (cmd === 2 || cmd === 3) {
      x += pbf.read_svarint();
      y += pbf.read_svarint();
      if (cmd === 2) {
        if (ring) rings.push(ring);
        ring = [];
      }
      ring!.push({ x, y });
    } else if (cmd === 7) {
      ring!.push({ ...ring![0] });
    } else {
      throw new Error(`unknown geometry command ${cmd} @${pbf.pos}`);
    }
  }
  if (ring) rings.push(ring);
  return rings;
}

/** tdt.js: UC + WC + GC — 4=id, 3=tags, 2=type, 1=geometry */
function read_tvt_feature(pbf: Pbf, layer: Layer, pos: number): Feature {
  pbf.pos = pos;
  const end = pbf.read_varint() + pbf.pos;
  const f: Feature = { type: 0, tags: [], properties: {}, geometry: [] };
  let geom_pos = -1;
  pbf.fields((field, p) => {
    if (field === 4) f.id = p.read_varint();
    else if (field === 3) {
      const t_end = p.read_varint() + p.pos;
      while (p.pos < t_end) f.tags.push(p.read_varint(), p.read_varint());
    } else if (field === 2) f.type = ENCRPT_TYPE[p.read_varint()] ?? 0;
    else if (field === 1) geom_pos = p.pos;
  }, end);
  for (let i = 0; i < f.tags.length; i += 2) {
    f.properties[layer.keys[f.tags[i]]] = layer.values[f.tags[i + 1]]?.value ??
      null;
  }
  if (geom_pos >= 0 && f.type !== 0) {
    f.geometry = load_tvt_geometry(pbf, geom_pos);
  }
  return f;
}

/** tdt.js: JC + YC — 15=version, 2=name, 5=extent, 1=features, 4=keys, 3=values */
function read_tvt_layer(pbf: Pbf, end: number): Layer {
  const layer: Layer = {
    name: null,
    version: 1,
    extent: 4096,
    keys: [],
    values: [],
    features: [],
  };
  const feature_pos: number[] = [];
  pbf.fields((field, p) => {
    if (field === 0xf) layer.version = p.read_varint();
    else if (field === 2) layer.name = p.read_string();
    else if (field === 5) layer.extent = p.read_varint();
    else if (field === 1) feature_pos.push(p.pos);
    else if (field === 4) layer.keys.push(p.read_string());
    else if (field === 3) layer.values.push(read_tvt_value(p));
  }, end);
  for (const pos of feature_pos) {
    layer.features.push(read_tvt_feature(pbf, layer, pos));
  }
  // 复位：解析要素会把 pos 留在层内部，外层 tile 循环需要它停在层末尾
  pbf.pos = end;
  return layer;
}

/**
 * 【纯 schema 层】已去混淆的 TVT protobuf -> 图层结构。tdt.js: ZC — 顶层 field 3 = layers
 *
 * 这里不做任何校验，也不区分接口；想"从接口响应一步到位"请用：
 *   vts 接口 -> `parse_vts_tile`
 *   tvt 接口 -> `../tvt/mvt.ts` 的 `parse_tvt_tile`
 */
export function parse_tvt_proto(tile: Uint8Array): TileStats {
  const pbf = new Pbf(tile);
  const layers: Layer[] = [];
  pbf.fields((field, p) => {
    if (field === 3) layers.push(read_tvt_layer(p, p.read_varint() + p.pos));
  });
  return { layers, consumed: pbf.pos };
}

// ---------- 接口入口 ----------

/**
 * 带 tile 字节混淆的 TVT 载荷 -> 内部结构（严格校验）。
 *
 * 这就是 vts 接口响应的原样形态；tvt 接口把密文头解掉之后拿到的明文，也长成这样
 * （见 `../tvt/mvt.ts`），所以两个接口共用这一个入口。
 *
 * 严格校验，宁可报错也不吐出半个瓦片：
 *   - 至少解析出一个图层
 *   - 顶层必须恰好消费完整个 buffer（即分帧完整）
 *
 * 入参必须是【带混淆的原始字节】：去混淆是自逆运算，已经去混淆过的载荷再进来会被当成垃圾。
 */
export function parse_tvt_payload(raw: Uint8Array): VtsTile {
  if (!raw.length) throw new Error("TVT 载荷为空 (0 字节)");

  const tile = deobfuscate_tile(raw);

  // 解析器自己的报错偏底层(比如 Unimplemented type: 6 @2)，包一层带上长度更好定位
  let parsed: TileStats;
  try {
    parsed = parse_tvt_proto(tile);
  } catch (e) {
    throw new Error(
      `TVT 载荷解析失败: ${(e as Error).message} (${raw.length}B)`,
    );
  }
  const { layers, consumed } = parsed;

  if (!layers.length) {
    throw new Error(`TVT 载荷解析不出图层 (${raw.length}B)`);
  }
  if (consumed !== tile.length) {
    throw new Error(
      `TVT 载荷分帧不完整: 消费 ${consumed}B / 共 ${tile.length}B`,
    );
  }
  return { tile, layers, consumed };
}

/**
 * 报错辅助：vts 的载荷没有 [32B 前缀 + 4B salt] 密文头，所以一旦前 32B 取反后
 * 看着像个 hex 串，基本就是把 tvt 接口的密文拿来解了。
 *
 * 这里刻意只做本地判断，不去 import `../tvt` —— 依赖方向是 tvt -> vts，不能反过来。
 */
function tvt_cipher_hint(raw: Uint8Array): string {
  if (raw.length < 32) return "";
  const prefix = raw.slice(0, 32);
  for (let i = 0; i < prefix.length; i++) prefix[i] = ~prefix[i] & 255;
  const tk = new TextDecoder().decode(prefix);
  return /^[0-9a-f]{16,64}$/.test(tk)
    ? `; 前 32B 取反是 ${
      JSON.stringify(tk)
    }，这是 tvt 接口的密文，要用 @liuxspro/tianditu/tvt 先解掉那层 SHA256 密钥流`
    : "";
}

/** vts 接口的原始响应字节 -> TVT 内部结构（就是 `parse_tvt_payload` 加个误用提示） */
export function parse_vts_tile(raw: Uint8Array): VtsTile {
  try {
    return parse_tvt_payload(raw);
  } catch (e) {
    throw new Error(`${(e as Error).message}${tvt_cipher_hint(raw)}`);
  }
}

/**
 * vts 接口的原始响应字节 -> 标准 MVT 字节。
 *
 * 只认 vts 这一种输入；tvt 的密文见 `../tvt/mvt.ts` 的 `tvt_tile_to_standard_mvt`。
 */
export function vts_tile_to_standard_mvt(raw: Uint8Array): Uint8Array {
  return encode_standard_mvt(parse_vts_tile(raw).layers);
}

// ---------- 标准 MVT 编码 ----------

class Writer {
  private buf: number[] = [];
  byte(v: number) {
    this.buf.push(v & 255);
  }
  varint(v: number) {
    v = Math.trunc(v);
    if (v < 0) throw new Error(`varint 不能为负: ${v}`);
    while (v > 0x7f) {
      this.buf.push((v & 0x7f) | 0x80);
      v = Math.floor(v / 128);
    }
    this.buf.push(v);
  }
  bytes(a: ArrayLike<number>) {
    for (let i = 0; i < a.length; i++) this.buf.push(a[i] & 255);
  }
  str(s: string) {
    const e = new TextEncoder().encode(s);
    this.varint(e.length);
    this.bytes(e);
  }
  /** tag + len + 子消息 */
  message(tag: number, sub: Writer) {
    this.varint(tag);
    this.varint(sub.length);
    // 注意：不能用 this.buf.push(...sub.buf) —— 大瓦片(几十万字节)会把参数展开撑爆调用栈
    const src = sub.buf;
    for (let i = 0; i < src.length; i++) this.buf.push(src[i]);
  }
  /** 与 message 等价，但直接接字节数组，少一层 Writer 包装 */
  message_bytes(tag: number, sub: Uint8Array) {
    this.varint(tag);
    this.varint(sub.length);
    for (let i = 0; i < sub.length; i++) this.buf.push(sub[i]);
  }
  get length() {
    return this.buf.length;
  }
  finish() {
    return new Uint8Array(this.buf);
  }
}

const zigzag = (n: number) => (n < 0 ? -2 * n - 1 : 2 * n);

const f32 = (v: number) => {
  const a = new ArrayBuffer(4);
  new DataView(a).setFloat32(0, v, true);
  return new Uint8Array(a);
};

const f64 = (v: number) => {
  const a = new ArrayBuffer(8);
  new DataView(a).setFloat64(0, v, true);
  return new Uint8Array(a);
};

/** 标准 MVT Value: 1=string, 2=float, 3=double, 4=int, 5=uint, 6=sint, 7=bool */
function encode_value(v: Value): Uint8Array {
  const w = new Writer();
  switch (v.kind) {
    case "string":
      w.varint(0x0a);
      w.str(String(v.value ?? ""));
      break;
    case "float":
      w.varint(0x15);
      w.bytes(f32(Number(v.value)));
      break;
    case "double":
      w.varint(0x19);
      w.bytes(f64(Number(v.value)));
      break;
    case "int":
      w.varint(0x20);
      w.varint(Number(v.value));
      break;
    case "uint":
      w.varint(0x28);
      w.varint(Number(v.value));
      break;
    case "sint":
      w.varint(0x30);
      w.varint(zigzag(Number(v.value)));
      break;
    case "bool":
      w.varint(0x38);
      w.varint(v.value ? 1 : 0);
      break;
  }
  return w.finish();
}

/** 标准 MVT 几何: MoveTo=1, LineTo=2, ClosePath=7, 坐标为 zigzag 增量 */
function encode_geometry(type: number, rings: Point[][]): Uint8Array {
  const cmds: number[] = [];
  let x = 0, y = 0;
  const pt = (p: Point) => {
    cmds.push(zigzag(p.x - x), zigzag(p.y - y));
    x = p.x;
    y = p.y;
  };
  if (type === 1) {
    const pts = rings.flat();
    if (pts.length) {
      cmds.push((pts.length << 3) | 1);
      for (const p of pts) pt(p);
    }
  } else {
    for (const ring of rings) {
      let pts = ring;
      // 多边形: 源里用 ClosePath 显式闭合, 标准 MVT 用 ClosePath 命令, 去掉重复尾点
      const last = pts.at(-1);
      if (
        type === 3 && pts.length > 1 && last && pts[0].x === last.x &&
        pts[0].y === last.y
      ) {
        pts = pts.slice(0, -1);
      }
      if (!pts.length) continue;
      cmds.push((1 << 3) | 1);
      pt(pts[0]);
      if (pts.length > 1) {
        cmds.push(((pts.length - 1) << 3) | 2);
        for (let i = 1; i < pts.length; i++) pt(pts[i]);
      }
      if (type === 3) cmds.push(7);
    }
  }
  const w = new Writer();
  for (const c of cmds) w.varint(c);
  return w.finish();
}

/** 标准 MVT Feature: 1=id, 2=tags(packed), 3=type, 4=geometry(packed) */
function encode_feature(f: Feature): Uint8Array {
  const w = new Writer();
  if (f.id !== undefined) {
    w.varint(0x08);
    w.varint(f.id);
  }
  if (f.tags.length) {
    const t = new Writer();
    for (const v of f.tags) t.varint(v);
    w.message(0x12, t);
  }
  w.varint(0x18);
  w.varint(f.type);
  if (f.type !== 0 && f.geometry.length) {
    w.message_bytes(0x22, encode_geometry(f.type, f.geometry));
  }
  return w.finish();
}

/** 标准 MVT Layer: 1=name, 2=features, 3=keys, 4=values, 5=extent, 15=version */
function encode_layer(l: Layer): Uint8Array {
  const w = new Writer();
  if (l.name !== null) {
    w.varint(0x0a);
    w.str(l.name);
  }
  for (const f of l.features) w.message_bytes(0x12, encode_feature(f));
  for (const k of l.keys) {
    w.varint(0x1a);
    w.str(k);
  }
  for (const v of l.values) w.message_bytes(0x22, encode_value(v));
  w.varint(0x28);
  w.varint(l.extent);
  w.varint(0x78);
  w.varint(l.version);
  return w.finish();
}

/** 把解析后的图层重编码为标准 MVT Tile */
export function encode_standard_mvt(layers: Layer[]): Uint8Array {
  const w = new Writer();
  for (const l of layers) w.message_bytes(0x1a, encode_layer(l)); // Tile.layers = 3
  return w.finish();
}

// ---------- 标准 MVT 回读（用于自检 / 往返校验） ----------

function read_std_value(pbf: Pbf): Value {
  const end = pbf.read_varint() + pbf.pos;
  let v: Value = { kind: "string", value: null };
  pbf.fields((f, p) => {
    if (f === 1) v = { kind: "string", value: p.read_string() };
    else if (f === 2) v = { kind: "float", value: p.read_float() };
    else if (f === 3) v = { kind: "double", value: p.read_double() };
    else if (f === 4) v = { kind: "int", value: p.read_varint() };
    else if (f === 5) v = { kind: "uint", value: p.read_varint() };
    else if (f === 6) v = { kind: "sint", value: p.read_svarint() };
    else if (f === 7) v = { kind: "bool", value: p.read_boolean() };
  }, end);
  return v;
}

/** 标准 MVT 几何: MoveTo=1, LineTo=2, ClosePath=7 */
function load_std_geometry(pbf: Pbf, geom_pos: number): Point[][] {
  pbf.pos = geom_pos;
  const end = pbf.read_varint() + pbf.pos;
  let cmd = 1, len = 0, x = 0, y = 0;
  const rings: Point[][] = [];
  let ring: Point[] | undefined;
  while (pbf.pos < end) {
    if (len <= 0) {
      const c = pbf.read_varint();
      cmd = c & 7;
      len = Math.floor(c / 8);
    }
    len--;
    if (cmd === 1 || cmd === 2) {
      x += pbf.read_svarint();
      y += pbf.read_svarint();
      if (cmd === 1) {
        if (ring) rings.push(ring);
        ring = [];
      }
      ring!.push({ x, y });
    } else if (cmd === 7) {
      ring!.push({ ...ring![0] });
    } else {
      throw new Error(`unknown geometry command ${cmd} @${pbf.pos}`);
    }
  }
  if (ring) rings.push(ring);
  return rings;
}

function read_std_feature(pbf: Pbf, layer: Layer, pos: number): Feature {
  pbf.pos = pos;
  const end = pbf.read_varint() + pbf.pos;
  const f: Feature = { type: 0, tags: [], properties: {}, geometry: [] };
  let geom_pos = -1;
  pbf.fields((field, p) => {
    if (field === 1) f.id = p.read_varint();
    else if (field === 2) {
      const t_end = p.read_varint() + p.pos;
      while (p.pos < t_end) f.tags.push(p.read_varint());
    } else if (field === 3) f.type = p.read_varint();
    else if (field === 4) geom_pos = p.pos;
  }, end);
  for (let i = 0; i < f.tags.length; i += 2) {
    f.properties[layer.keys[f.tags[i]]] = layer.values[f.tags[i + 1]]?.value ??
      null;
  }
  if (geom_pos >= 0 && f.type !== 0) {
    f.geometry = load_std_geometry(pbf, geom_pos);
  }
  return f;
}

/** 标准 MVT Layer: 1=name, 2=features, 3=keys, 4=values, 5=extent, 15=version */
function read_std_layer(pbf: Pbf, end: number): Layer {
  const layer: Layer = {
    name: null,
    version: 1,
    extent: 4096,
    keys: [],
    values: [],
    features: [],
  };
  const feature_pos: number[] = [];
  pbf.fields((field, p) => {
    if (field === 1) layer.name = p.read_string();
    else if (field === 2) feature_pos.push(p.pos);
    else if (field === 3) layer.keys.push(p.read_string());
    else if (field === 4) layer.values.push(read_std_value(p));
    else if (field === 5) layer.extent = p.read_varint();
    else if (field === 0xf) layer.version = p.read_varint();
  }, end);
  for (const pos of feature_pos) {
    layer.features.push(read_std_feature(pbf, layer, pos));
  }
  // 复位：解析要素会把 pos 留在层内部，外层 tile 循环需要它停在层末尾
  pbf.pos = end;
  return layer;
}

/** 用标准 MVT schema 回读一块瓦片 */
export function parse_standard_tile(tile: Uint8Array): TileStats {
  const pbf = new Pbf(tile);
  const layers: Layer[] = [];
  pbf.fields((field, p) => {
    if (field === 3) layers.push(read_std_layer(p, p.read_varint() + p.pos));
  });
  return { layers, consumed: pbf.pos };
}

/** 比较两份图层结构，返回差异描述（空数组 = 完全一致） */
export function compare_layers(a: Layer[], b: Layer[]): string[] {
  const diffs: string[] = [];
  if (a.length !== b.length) return [`图层数不同: ${a.length} vs ${b.length}`];
  for (let i = 0; i < a.length; i++) {
    const [x, y] = [a[i], b[i]];
    const tag = `图层[${i}] "${x.name}"`;
    if (x.name !== y.name) {
      diffs.push(`${tag} name 不同: ${x.name} vs ${y.name}`);
    }
    if (x.version !== y.version) diffs.push(`${tag} version 不同`);
    if (x.extent !== y.extent) diffs.push(`${tag} extent 不同`);
    if (JSON.stringify(x.keys) !== JSON.stringify(y.keys)) {
      diffs.push(`${tag} keys 不同`);
    }
    if (JSON.stringify(x.values) !== JSON.stringify(y.values)) {
      diffs.push(`${tag} values 不同`);
    }
    if (x.features.length !== y.features.length) {
      diffs.push(
        `${tag} 要素数不同: ${x.features.length} vs ${y.features.length}`,
      );
      continue;
    }
    for (let j = 0; j < x.features.length; j++) {
      const [p, q] = [x.features[j], y.features[j]];
      if (p.id !== q.id) diffs.push(`${tag} 要素[${j}] id 不同`);
      if (p.type !== q.type) {
        diffs.push(`${tag} 要素[${j}] type 不同: ${p.type} vs ${q.type}`);
      }
      if (JSON.stringify(p.tags) !== JSON.stringify(q.tags)) {
        diffs.push(`${tag} 要素[${j}] tags 不同`);
      }
      if (JSON.stringify(p.geometry) !== JSON.stringify(q.geometry)) {
        diffs.push(`${tag} 要素[${j}] 几何不同`);
      }
      if (diffs.length > 20) return diffs;
    }
  }
  return diffs;
}
