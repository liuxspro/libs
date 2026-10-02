/**
 * 将 xyz 坐标转换为 vts 接口的 pk 字符串。
 * 算法取自官方在线地图 https://map.tianditu.gov.cn/static/js/main.*.js
 */
export function xyz2pk(x: number, y: number, z: number): string {
  let n = "";
  for (let a = z; a >= 0; --a) {
    const mask = 1 << a; // 重命名避免混淆
    let o = 0;
    if (x & mask) o |= 1; // 检查e的当前位
    if (y & mask) o |= 2; // 检查t的当前位
    n += o;
  }
  let o = n.split("").reverse().join("");
  const i = "9876";
  for (let a = 0; a < i.length; a++) {
    const e = Number(i[a]);
    if (e >= o.length) continue;
    const t = 1 + Number(o.substring(e, e + 1));
    o = E(o, e, t);
  }
  return I(o);
}

const E = (e: string, t: number, r: number) =>
  e.substring(0, t) + r + e.substring(t + 1);

const I = (e: string) => {
  let t = "",
    r = "",
    n = 0;
  for (let o = 0; o < e.length; o++) {
    const i = 3 * Number(e[o]);
    let a = t.length - 1;
    const s = String.fromCharCode(97 + i);
    if (s === r) {
      n++;
      if (1 === n) {
        a++;
      } else if (n > 10) {
        a--;
      }
      t = t.slice(0, a) + n;
    } else {
      t += s;
      r = s;
      n = 0;
    }
  }
  return t;
};

/**
 * xyz2pk 的逆运算: 从 vts 接口的 pk 反推瓦片号。
 *
 * 规则(由 xyz2pk 反推):
 *  1. 游程展开: 字母代表 0-3 的四叉树数字(charCode = 97 + 3*digit), 其后可跟十进制
 *     "额外重复次数"(`a1` = 两个 `a`, `a12` = 十三个 `a`);
 *  2. 撤掉混淆: 对下标 9,8,7,6 各减 1(与 xyz2pk 里 +1 的步骤对应);
 *  3. 反转后得到高位在前的四叉树键, 长度 = z + 1(首位的 bit 恒为 0)。
 */
export function pk2xyz(pk: string): { x: number; y: number; z: number } {
  const digits: string[] = [];
  for (let i = 0; i < pk.length; i++) {
    const code = pk.charCodeAt(i) - 97;
    if (code < 0 || code % 3 !== 0) {
      throw new Error(`非法 pk 字符: ${JSON.stringify(pk[i])}`);
    }
    const value = code / 3;
    if (value > 8) throw new Error(`pk 数字越界: ${value}`);
    digits.push(String(value));
    let j = i + 1,
      count = "";
    while (j < pk.length && pk[j] >= "0" && pk[j] <= "9") count += pk[j++];
    if (count) {
      for (let k = 0; k < Number(count); k++) digits.push(String(value));
      i = j - 1;
    }
  }
  for (const e of [9, 8, 7, 6]) {
    if (e < digits.length) digits[e] = String(Number(digits[e]) - 1);
  }
  const key = digits.reverse().join("");
  const z = key.length - 1;
  let x = 0,
    y = 0;
  for (let k = 0; k <= z; k++) {
    const d = Number(key[k]);
    const level = z - k;
    if (d & 1) x |= 1 << level;
    if (d & 2) y |= 1 << level;
  }
  if (x >> z || y >> z) {
    throw new Error(`pk 解出的坐标越界: z=${z} x=${x} y=${y}`);
  }
  return { x, y, z };
}
