// tvt 接口瓦片 -> 标准 MVT 的测试。
// 重点是把 "tvt = vts + 一层解密" 这个结构钉住：解密后的明文必须能原样交给 vts 的入口。
import { assertEquals, assertThrows } from "@std/assert";
import {
  compare_layers,
  parse_standard_tile,
  parse_vts_tile,
  vts_tile_to_standard_mvt,
} from "../src/vts/mvt.ts";
import { decrypt_binary } from "../src/tvt/decrypt.ts";
import { parse_tvt_tile, tvt_tile_to_standard_mvt } from "../src/tvt/mvt.ts";

const rd = (name: string) =>
  Deno.readFile(new URL(`./data/${name}`, import.meta.url));

const tvt = new Uint8Array(await rd("tvt.mvt"));
const tvt2 = new Uint8Array(await rd("tvt2.mvt"));
const vts = new Uint8Array(await rd("vts.mvt"));

/** 大 buffer 不比全量(失败时生成 diff 会爆内存), 比长度 + SHA-256 摘要 */
const digest = async (u: Uint8Array) => {
  const h = await crypto.subtle.digest("SHA-256", u.slice().buffer);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.test("parse_tvt_tile: 5 个图层 / 222 个要素 / 分帧完整", () => {
  const parsed = parse_tvt_tile(tvt);
  assertEquals(parsed.layers.length, 5);
  assertEquals(parsed.layers.reduce((s, l) => s + l.features.length, 0), 222);
  assertEquals(parsed.tile.length, tvt.length - 32 - 4);
  assertEquals(parsed.consumed, parsed.tile.length);
});

Deno.test("【核心】tvt 解密后的明文可以直接交给 vts 的入口解析", () => {
  const plain = decrypt_binary(tvt)!;
  const via_tvt = parse_tvt_tile(tvt);
  const via_vts = parse_vts_tile(plain);

  assertEquals(via_vts.consumed, plain.length);
  assertEquals(compare_layers(via_tvt.layers, via_vts.layers), []);
});

Deno.test("【核心】tvt 转标准 MVT === vts 链路处理解密后的明文", async () => {
  const plain = decrypt_binary(tvt)!;
  const a = tvt_tile_to_standard_mvt(tvt);
  const b = vts_tile_to_standard_mvt(plain);

  assertEquals(a.length, b.length);
  assertEquals(await digest(a), await digest(b));
});

Deno.test("tvt_tile_to_standard_mvt: 产出可被标准 schema 完整读回, 往返无损", () => {
  const mvt = tvt_tile_to_standard_mvt(tvt);
  const { layers, consumed } = parse_standard_tile(mvt);

  assertEquals(consumed, mvt.length);
  assertEquals(layers.length, 5);
  assertEquals(layers.reduce((s, l) => s + l.features.length, 0), 222);
  assertEquals(compare_layers(parse_tvt_tile(tvt).layers, layers), []);
});

Deno.test("tvt2.mvt: 换了 tk 的块照样能解, 且链路与 vts 完全等价", async () => {
  const parsed = parse_tvt_tile(tvt2);
  assertEquals(parsed.layers.length, 10);
  assertEquals(parsed.layers.reduce((s, l) => s + l.features.length, 0), 1370);
  assertEquals(parsed.tile.length, tvt2.length - 32 - 4);
  assertEquals(parsed.consumed, parsed.tile.length);

  // 核心性质在换了 TK 的块上同样成立
  const plain = decrypt_binary(tvt2)!;
  const a = tvt_tile_to_standard_mvt(tvt2);
  const b = vts_tile_to_standard_mvt(plain);
  assertEquals(a.length, b.length);
  assertEquals(await digest(a), await digest(b));
});

Deno.test("parse_tvt_tile: 空/太短/空载荷/截断一律报错", () => {
  assertThrows(() => parse_tvt_tile(new Uint8Array(0)), Error, "为空");
  assertThrows(() => parse_tvt_tile(tvt.slice(0, 35)), Error, "太短");
  assertThrows(() => parse_tvt_tile(new Uint8Array(36)), Error, "空载荷");
  assertThrows(() => parse_tvt_tile(tvt.slice(0, 500)), Error);
  assertThrows(() => parse_tvt_tile(tvt.slice(0, -1)), Error);
});

Deno.test("parse_tvt_tile: vts 的载荷不能当 tvt 密文解", () => {
  assertThrows(() => parse_tvt_tile(vts), Error);
});
