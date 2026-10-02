/**
 * 天地图 tvt 接口密文的解密实现。
 *
 * 官方在线地图（tdt.js: `ye.decryptBinary`）的密文结构：
 *
 * ```text
 * [32B 前缀][4B salt][密文......]
 *    ↑ 逐字节取反后是一串 ASCII 形式的 TK
 * ```
 *
 * 密钥材料就藏在密文自己身上，所以这个方案是 **自解** 的 —— 换过 TK 的瓦片也照样能解。
 *
 * 实际上这个前缀就是请求 URL 里 `tk` 参数的 **原样回显**：同一块瓦片换个 tk 再请求，
 * 前缀就跟着变，salt 和密文也变，但 **解密出来的明文完全相同**。所以这层没有保密性，
 * 只是混淆 —— 拿到响应的人都能解，别把它当安全边界。
 *
 * 派生方式：`sha256(hex(32B 前缀) + hex(salt))`，注意种子是那串 hex **文本** 的
 * UTF-8 字节，不是原始字节。明文 = `ROTR1(每个密文字节) ^ 密钥流[i % 32]`。
 *
 * 解出来的明文还不是标准 MVT，也仍然带着 tile 字节混淆：它正是 vts 接口响应的原样形态，
 * 所以后续的解析/重编码全部复用 `../vts/mvt.ts`，本模块只管解密这一层。
 */
import { createHash } from "node:crypto";

/** 密文头 = 32B 前缀 + 4B salt */
export const SALT_LENGTH = 4;

/** 每个字节循环右移 1 位 */
const rot_right_1 = (x: number) => ((x >> 1) | ((x & 1) << 7)) & 255;

const to_hex = (u: Uint8Array) =>
  Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");

const sha256 = (d: Uint8Array) =>
  new Uint8Array(createHash("sha256").update(d).digest());

/**
 * 从密文前 32 字节恢复内嵌的 TK（逐字节取反后的 ASCII）。
 *
 * 输入不足 32 字节时返回 `undefined`。
 */
export function recover_tk(input: Uint8Array): string | undefined {
  if (input.length < 32) return;
  const prefix = input.slice(0, 32);
  for (let i = 0; i < prefix.length; i++) prefix[i] = ~prefix[i] & 255;
  return new TextDecoder().decode(prefix);
}

/**
 * 密文 -> 明文（仍带 tile 字节混淆，即 vts 接口响应的形态）。
 *
 * - 输入短于 32 + 4 字节时返回 `undefined`（不可能是一块密文）
 * - 传 `expect_tk` 可复现原实现的校验语义：前缀不是它时返回 **空的** `Uint8Array`
 *   （tdt.js 的 `deriveWorkKey` 在 `prefix !== TK` 时给一个空 key），而不是抛错。
 *   注意这 **不是安全校验**（前缀本来就能直接从密文读出来），只是核对
 *   "服务端回显的 tk 是不是我发出去的那个"
 *
 * 只做解密；要一步到位转成标准 MVT，用 `./mvt.ts` 的 `tvt_tile_to_standard_mvt`。
 */
export function decrypt_binary(
  input: Uint8Array,
  expect_tk?: string,
): Uint8Array | undefined {
  if (input.length < 32 + SALT_LENGTH) return;
  const tk = recover_tk(input)!;
  if (expect_tk !== undefined && tk !== expect_tk) return new Uint8Array(); // 原实现：空 key
  const salt = input.subarray(32, 32 + SALT_LENGTH);
  const cipher = input.subarray(32 + SALT_LENGTH);
  // 种子是 hex(前缀) + hex(salt) 这串 **文本** 的 UTF-8 字节（小写 hex）
  const seed = to_hex(new TextEncoder().encode(tk)) + to_hex(salt);
  const key = sha256(new TextEncoder().encode(seed));
  const out = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    out[i] = (rot_right_1(cipher[i]) ^ key[i % key.length]) & 255;
  }
  return out;
}
