/**
 * 天地图 tvt 接口矢量瓦片 -> 标准 MVT。
 *
 * tvt 相比 vts 只多一层密文解密（见 `./decrypt.ts`）。解出来的明文就是 vts 接口响应的
 * 原样形态，所以这里除了解密之外 **全部复用 `../vts/mvt.ts`**，不重复实现任何解析或编码：
 *
 * ```ts
 * import { tvt_tile_to_standard_mvt } from "@liuxspro/tianditu/tvt";
 *
 * const mvt: Uint8Array = tvt_tile_to_standard_mvt(tvt_response_bytes);
 * ```
 *
 * ```text
 * vts 接口:  [去混淆] -> [按私有 schema 解析] -> [重编码为标准 MVT]
 * tvt 接口:  [解密] -> 上面同一条链路
 * ```
 */
import {
  encode_standard_mvt,
  parse_tvt_payload,
  type VtsTile,
} from "../vts/mvt.ts";
import { decrypt_binary, SALT_LENGTH } from "./decrypt.ts";

/**
 * tvt 接口的原始响应字节 -> TVT 内部结构。
 *
 * 等价于 `parse_tvt_payload(decrypt_binary(raw))`，只是把解密阶段的失败情形讲清楚：
 * 太短（放不下密文头）、或者解出来是空的（前缀不是合法 TK）。
 */
export function parse_tvt_tile(raw: Uint8Array): VtsTile {
  if (!raw.length) throw new Error("tvt 密文为空 (0 字节)");

  const plain = decrypt_binary(raw);
  if (plain === undefined) {
    throw new Error(
      `tvt 密文太短: ${raw.length}B，密文头至少要 32B 前缀 + ${SALT_LENGTH}B salt`,
    );
  }
  if (!plain.length) {
    throw new Error(
      `tvt 解密得到空载荷: 密文共 ${raw.length}B，扣掉密文头就没内容了`,
    );
  }
  return parse_tvt_payload(plain);
}

/**
 * tvt 接口的原始响应字节 -> 标准 MVT 字节。
 *
 * vts 接口对应的是 `../vts/mvt.ts` 的 `vts_tile_to_standard_mvt`。
 */
export function tvt_tile_to_standard_mvt(raw: Uint8Array): Uint8Array {
  return encode_standard_mvt(parse_tvt_tile(raw).layers);
}
