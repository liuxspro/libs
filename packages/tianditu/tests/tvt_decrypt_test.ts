// tvt 解密层（src/tvt/decrypt.ts）的测试
import { assertEquals } from "@std/assert";
import { decrypt_binary, recover_tk, SALT_LENGTH } from "../src/tvt/decrypt.ts";

const raw = new Uint8Array(
  await Deno.readFile(new URL("./data/tvt.mvt", import.meta.url)),
);
const raw2 = new Uint8Array(
  await Deno.readFile(new URL("./data/tvt2.mvt", import.meta.url)),
);

// 当初下载这两块瓦片时请求里的 tk —— 服务端把它们原样回显在了前 32B。
// 刻意写成字面量而不是库里的常量：这个值随请求变，不属于包对外的 API。
const EMBEDDED_TK = "90ec87c3e7966ac7b84b0f10d88f1a93";
const EMBEDDED_TK_2 = "d635c1c88c51e7590cfb399252f22ff1";

Deno.test("recover_tk: 前 32B 取反就是内嵌的 TK（方案是自解的）", () => {
  assertEquals(recover_tk(raw), EMBEDDED_TK);
  assertEquals(recover_tk(raw)!.length, 32);
});

Deno.test("recover_tk: 不足 32B 返回 undefined", () => {
  assertEquals(recover_tk(new Uint8Array(0)), undefined);
  assertEquals(recover_tk(new Uint8Array(31)), undefined);
});

Deno.test("recover_tk: 内嵌 TK 随瓦片而变, 只能从密文里读", () => {
  // 两块是在不同 tk 下请求的, 前缀就跟着不同 —— 所以这值不可能写死在库里
  assertEquals(recover_tk(raw), EMBEDDED_TK);
  assertEquals(recover_tk(raw2), EMBEDDED_TK_2);
  assertEquals(recover_tk(raw) === recover_tk(raw2), false);
  // 拿旧块的 TK 去校验新块, 必然对不上（空 key）
  assertEquals(decrypt_binary(raw2, EMBEDDED_TK)!.length, 0);
  assertEquals(decrypt_binary(raw, EMBEDDED_TK_2)!.length, 0);
});

Deno.test("decrypt_binary: 明文 = 密文 - 32B 前缀 - 4B salt", () => {
  const plain = decrypt_binary(raw)!;
  assertEquals(plain.length, raw.length - 32 - SALT_LENGTH);
  assertEquals(SALT_LENGTH, 4);
});

Deno.test("decrypt_binary: expect_tk 匹配时与不传一致，不匹配时给空 key", () => {
  const plain = decrypt_binary(raw)!;
  assertEquals(decrypt_binary(raw, EMBEDDED_TK)!.length, plain.length);
  assertEquals(decrypt_binary(raw, "0".repeat(32))!.length, 0);
});

Deno.test("decrypt_binary: 太短（< 36B）返回 undefined；恰好 36B 时明文为空", () => {
  assertEquals(decrypt_binary(new Uint8Array(0)), undefined);
  assertEquals(decrypt_binary(new Uint8Array(35)), undefined);
  assertEquals(decrypt_binary(new Uint8Array(36))!.length, 0);
});

Deno.test("decrypt_binary: 换掉内嵌 TK 也照样能解（密钥来自密文自身）", () => {
  const other = "0123456789abcdef0123456789abcdef";
  const mine = raw.slice();
  const enc = new TextEncoder().encode(other);
  for (let i = 0; i < 32; i++) mine[i] = ~enc[i] & 255;

  assertEquals(recover_tk(mine), other);
  const a = decrypt_binary(raw)!;
  const b = decrypt_binary(mine)!;
  assertEquals(b.length, a.length);
  assertEquals(
    a.every((v, i) => v === b[i]),
    false,
    "换了 TK 之后密钥流不同，明文应当不同",
  );
});
