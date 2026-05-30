/**
 * LYR 流二进制修补器
 *
 * 在 Layer 流二进制数据中搜索旧字符串块并替换为新字符串块。
 * 字符串格式: [uint32 total_bytes] [UTF-16-LE data + \\x00\\x00]
 */

function buildStringBlock(s: string): Uint8Array {
  const utf16 = new Uint8Array(s.length * 2 + 2);
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    utf16[i * 2] = cp & 0xff;
    utf16[i * 2 + 1] = (cp >> 8) & 0xff;
  }
  const block = new Uint8Array(4 + utf16.length);
  const dv = new DataView(block.buffer);
  dv.setUint32(0, utf16.length, true);
  block.set(utf16, 4);
  return block;
}

export interface StringReplace {
  oldValue: string;
  newValue: string;
  label: string;
}

export interface PatchResult {
  changes: string[];
  modified: Uint8Array;
}

function indexOf(data: Uint8Array, search: Uint8Array, fromIndex = 0): number {
  if (search.byteLength === 0) return 0;
  const end = data.byteLength - search.byteLength;
  for (let i = fromIndex; i <= end; i++) {
    let found = true;
    for (let j = 0; j < search.byteLength; j++) {
      if (data[i + j] !== search[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function replaceAll(
  data: Uint8Array,
  search: Uint8Array,
  replacement: Uint8Array,
): Uint8Array {
  const parts: Uint8Array[] = [];
  let pos = 0;
  while (true) {
    const idx = indexOf(data, search, pos);
    if (idx === -1) {
      parts.push(data.subarray(pos));
      break;
    }
    parts.push(data.subarray(pos, idx));
    parts.push(replacement);
    pos = idx + search.byteLength;
  }
  const totalLen = parts.reduce((sum, p) => sum + p.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.byteLength;
  }
  return result;
}

export function patchLayerStream(
  layerData: Uint8Array,
  replaces: StringReplace[],
): PatchResult {
  let data: Uint8Array = new Uint8Array(layerData);
  const changes: string[] = [];

  for (const r of replaces) {
    const oldBlock = buildStringBlock(r.oldValue);
    const newBlock = buildStringBlock(r.newValue);

    let count = 0;
    let idx = 0;
    while (true) {
      idx = indexOf(data, oldBlock, idx);
      if (idx === -1) break;
      count++;
      idx++;
    }

    if (count > 0) {
      data = replaceAll(data, oldBlock, newBlock);
      changes.push(r.label);
    }
  }

  return { changes, modified: data };
}
