// vts 接口瓦片 -> 标准 MVT 的测试
// 运行: deno test --allow-read (在仓库根 /d/Dev/libs 下)
import { assertEquals, assertThrows } from "@std/assert";
import {
  compare_layers,
  deobfuscate_tile,
  encode_standard_mvt,
  parse_standard_tile,
  parse_tvt_payload,
  parse_vts_tile,
  Pbf,
  TILE_FLIP_INDEXES,
  TYPE_NAME,
  vts_tile_to_standard_mvt,
} from "../src/vts/mvt.ts";

const vts = new Uint8Array(
  await Deno.readFile(new URL("./data/vts.mvt", import.meta.url)),
);
const parsed = parse_vts_tile(vts);
const layers = parsed.layers;

/** 大 buffer 不比全量(失败时生成 diff 会爆内存), 比长度 + SHA-256 摘要 */
const digest = async (u: Uint8Array) => {
  const h = await crypto.subtle.digest("SHA-256", u.slice().buffer);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const count_of = (name: string, type: string) =>
  layers.find((l) => l.name === name)!.features.filter((f) =>
    TYPE_NAME[f.type] === type
  ).length;

/** 跳过 tile 的 tag + 长度 varint（宽度不定），返回第一层 payload 的起始下标 */
function first_layer_offset(bytes: Uint8Array): number {
  let i = 1;
  while (bytes[i] & 0x80) i++;
  return i + 1;
}

// ---------- 解析 ----------

Deno.test("parse_vts_tile: 去混淆后恰好消费完整个 buffer", () => {
  assertEquals(parsed.consumed, vts.length);
  assertEquals(parsed.tile.length, vts.length);
  assertEquals(parsed.tile, deobfuscate_tile(vts));
});

Deno.test("parse_vts_tile: 17 个图层 / 1065 个要素 / 全部 v2 extent 4096", () => {
  assertEquals(layers.length, 17);
  assertEquals(layers.reduce((a, l) => a + l.features.length, 0), 1065);
  for (const l of layers) {
    assertEquals(l.version, 2);
    assertEquals(l.extent, 4096);
  }
});

Deno.test("解析出的属性与几何正确 (取真实图层做定值校验)", () => {
  const bl = layers.find((l) => l.name === "BL")!;
  assertEquals(bl.keys, ["B7", "I8"]);
  assertEquals(bl.features[0].properties, { B7: "南", I8: "4" });

  const bv = layers.find((l) => l.name === "BV")!;
  assertEquals(bv.keys, ["Z5"]);
  assertEquals(bv.values.map((v) => v.value), [
    "PHILIPPINES",
    "PALAU",
    "BRUNEI",
    "MALAYSIA",
    "CHINA",
    "INDONESIA",
  ]);

  assertEquals(count_of("BV", "Polygon"), 85);
  assertEquals(count_of("AW", "LineString"), 599);
  assertEquals(count_of("BV", "Point"), 0);

  // 多边形环必须闭合, 坐标落在 extent 附近
  let rings = 0;
  for (const l of layers) {
    for (const f of l.features) {
      for (const ring of f.geometry) {
        rings++;
        for (const p of ring) {
          assertEquals(
            p.x > -300 && p.x < l.extent + 300,
            true,
            `x 越界: ${p.x}`,
          );
          assertEquals(
            p.y > -300 && p.y < l.extent + 300,
            true,
            `y 越界: ${p.y}`,
          );
        }
        if (TYPE_NAME[f.type] === "Polygon" && ring.length > 1) {
          assertEquals(ring[0], ring.at(-1), "多边形环未闭合");
        }
      }
    }
  }
  assertEquals(rings > 1000, true, `环数偏少: ${rings}`);
});

Deno.test("deobfuscate_tile: 只翻转 [1,2,3,4,99], 且是自逆运算", () => {
  const raw = vts.slice();
  const dec = deobfuscate_tile(raw);
  for (const i of TILE_FLIP_INDEXES) assertEquals(dec[i], ~raw[i] & 255);
  for (const i of [0, 5, 98, 100]) {
    assertEquals(dec[i], raw[i], `下标 ${i} 不该被翻转`);
  }
  assertEquals(deobfuscate_tile(dec), raw); // 再翻一次回到原值
});

// ---------- 转标准 MVT ----------

Deno.test("vts_tile_to_standard_mvt: 产出可被标准 schema 完整读回, 往返无损", () => {
  const mvt = vts_tile_to_standard_mvt(vts);
  assertEquals(mvt.length, 59456);
  const { layers: back, consumed } = parse_standard_tile(mvt);
  assertEquals(consumed, mvt.length);
  assertEquals(back.length, 17);
  assertEquals(back.reduce((a, l) => a + l.features.length, 0), 1065);
  assertEquals(compare_layers(layers, back), []);
});

Deno.test("vts_tile_to_standard_mvt: 首字段号已换回标准 (name 而非 features)", () => {
  const mvt = vts_tile_to_standard_mvt(vts);
  assertEquals(mvt[0], 0x1a); // Tile.layers = 3

  // 标准 MVT 的 field 1 是 name：直接就是字符串 "BL"
  const s = first_layer_offset(mvt);
  assertEquals(mvt[s], 0x0a);
  assertEquals(mvt[s + 1], 2);
  assertEquals(new TextDecoder().decode(mvt.subarray(s + 2, s + 4)), "BL");

  // TVT 侧同样位置 field 1 是 features —— 一个子消息，内部才是 feature 的 tag
  const t = first_layer_offset(parsed.tile);
  assertEquals(parsed.tile[t], 0x0a);
  assertEquals(parsed.tile[t + 1], 15);
  assertEquals(
    parsed.tile[t + 2],
    0x0a,
    "features 内部应是 feature 子消息的 tag",
  );
});

Deno.test("vts_tile_to_standard_mvt: 等价于底层两步组合 (没有任何额外加工)", async () => {
  const direct = vts_tile_to_standard_mvt(vts);
  const manual = encode_standard_mvt(parse_vts_tile(vts).layers);
  assertEquals(direct.length, manual.length);
  assertEquals(await digest(direct), await digest(manual));
});

// ---------- 越界防护: 畸形/截断输入必须报错, 不能死循环 ----------

Deno.test("Pbf.read_varint: 越界立刻抛错 (回归: 曾经 while(true) 死循环吊死进程)", () => {
  // 0x80 的含义是"后面还有字节"; 单个 0x80 就是最典型的截断 varint。
  // 修复前 this.buf[pos++] 越界返回 undefined, 而 undefined < 0x80 恒为 false,
  // 于是 while(true) 永不退出 —— 这个用例当时会卡死整个测试进程。
  const pbf = new Pbf(new Uint8Array([0x80]));
  assertThrows(() => pbf.read_varint(), Error, "瓦片字节不足");
});

Deno.test("Pbf: length-delimited 与定长字段越界也抛错, 而不是把 pos 甩到界外", () => {
  // field 1 / wire 2 / 声称长度 127, 实际只有 2 字节
  assertThrows(
    () => new Pbf(new Uint8Array([0x0a, 0x7f])).fields(() => {}),
    Error,
    "瓦片字节不足",
  );
  // field 1 / wire 1 (64bit) 但只给 3 字节
  assertThrows(
    () => new Pbf(new Uint8Array([0x09, 0x00, 0x00])).fields(() => {}),
    Error,
    "瓦片字节不足",
  );
  // field 2 / wire 5 (32bit) 但只给 3 字节
  assertThrows(
    () => new Pbf(new Uint8Array([0x15, 0x00, 0x00])).fields(() => {}),
    Error,
    "瓦片字节不足",
  );
  // 长度 varint 声称 200 字节, 但 buffer 一共 2 字节
  assertThrows(
    () => new Pbf(new Uint8Array([0xc8, 0x01])).read_string(),
    Error,
    "字符串越界",
  );
});

Deno.test("parse_tvt_payload: 任意截断点要么报错, 要么消费不超过 buffer(绝不读到界外)", () => {
  for (let cut = 1; cut < parsed.tile.length; cut += 97) {
    const out = (() => {
      try {
        return parse_tvt_payload(parsed.tile.slice(0, cut));
      } catch {
        return null; // 报错是预期结局之一
      }
    })();
    if (out !== null) {
      assertEquals(
        out.consumed <= cut,
        true,
        `截到 ${cut}B 时消费了 ${out.consumed}B, 已读到界外`,
      );
    }
  }
});

Deno.test("parse_vts_tile: 空/垃圾/截断输入一律报错, 不静默产出半个瓦片", () => {
  assertThrows(() => parse_vts_tile(new Uint8Array(0)), Error, "为空");
  assertThrows(() => parse_vts_tile(new Uint8Array(64)), Error);
  assertThrows(() => parse_vts_tile(vts.slice(0, 100)), Error);
  assertThrows(() => parse_vts_tile(vts.slice(0, vts.length >> 1)), Error);
  assertThrows(() => parse_vts_tile(vts.slice(0, -1)), Error);
});

Deno.test("parse_vts_tile: 入参必须是接口原样字节(去混淆是自逆的)", () => {
  assertThrows(() => parse_vts_tile(parsed.tile), Error);
});

Deno.test("parse_standard_tile: 截断的标准 MVT 也抛错", () => {
  const mvt = vts_tile_to_standard_mvt(vts);
  assertThrows(() => parse_standard_tile(mvt.slice(0, 100)), Error);
  assertThrows(() => parse_standard_tile(mvt.slice(0, -1)), Error);
});
