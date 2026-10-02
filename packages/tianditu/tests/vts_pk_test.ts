// vts 接口的 pk <-> 瓦片号 编解码测试
import { assertEquals } from "@std/assert";
import { pk2xyz, xyz2pk } from "../src/vts/pk.ts";

Deno.test("xyz2pk: 已知样本 pk='jgjda' 对应 z=4 x=13 y=7", () => {
  assertEquals(xyz2pk(13, 7, 4), "jgjda");
  assertEquals(pk2xyz("jgjda"), { x: 13, y: 7, z: 4 });
});
