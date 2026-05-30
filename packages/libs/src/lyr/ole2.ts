/**
 * OLE2 复合文档解析器 / 写入器
 */

const FREE = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;

const enum DirEntryType {
  Stream = 2,
  Root = 5,
}

interface DirEntry {
  name: string;
  type: DirEntryType;
  firstSector: number;
  streamLength: number;
}

export interface Ole2Doc {
  data: Uint8Array;
  sectorSize: number;
  miniSectorSize: number;
  fat: Uint32Array;
  miniFat: Uint32Array;
  rootEntry: DirEntry;
  entries: Map<string, DirEntry>;
}

function readU32(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) |
    (data[offset + 2] << 16) | (data[offset + 3] << 24);
}

function writeU32(data: Uint8Array, offset: number, val: number): void {
  data[offset] = val & 0xff;
  data[offset + 1] = (val >> 8) & 0xff;
  data[offset + 2] = (val >> 16) & 0xff;
  data[offset + 3] = (val >> 24) & 0xff;
}

function readU16(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readSectorChain(
  data: Uint8Array,
  fat: Uint32Array,
  sectorSize: number,
  firstSector: number,
  length: number,
): Uint8Array {
  const result = new Uint8Array(length);
  let pos = 0;
  let cur = firstSector;
  while (cur !== FREE && cur !== END_OF_CHAIN) {
    const srcOff = (cur + 1) * sectorSize;
    const toCopy = Math.min(sectorSize, length - pos);
    result.set(data.subarray(srcOff, srcOff + toCopy), pos);
    pos += sectorSize;
    cur = fat[cur];
  }
  return result;
}

function getSectorChain(fat: Uint32Array, firstSector: number): number[] {
  const sectors: number[] = [];
  let cur = firstSector;
  while (cur !== FREE && cur !== END_OF_CHAIN) {
    sectors.push(cur);
    cur = fat[cur];
  }
  return sectors;
}

export function parseOle2(data: Uint8Array): Ole2Doc {
  const magic = new Uint8Array(data.buffer, data.byteOffset, 8);
  const expected = new Uint8Array([
    0xd0,
    0xcf,
    0x11,
    0xe0,
    0xa1,
    0xb1,
    0x1a,
    0xe1,
  ]);
  for (let i = 0; i < 8; i++) {
    if (magic[i] !== expected[i]) throw new Error("不是有效的 OLE2 文档");
  }

  const sectorSize = 1 << readU16(data, 30);
  const miniSectorSize = 1 << readU16(data, 32);
  const firstDirSector = readU32(data, 48);

  const difat: number[] = [];
  for (let i = 0; i < 109; i++) {
    const s = readU32(data, 76 + i * 4);
    if (s !== FREE && s !== END_OF_CHAIN) difat.push(s);
  }

  const fat: number[] = [];
  for (const sector of difat) {
    const off = (sector + 1) * sectorSize;
    for (let i = 0; i < sectorSize / 4; i++) {
      fat.push(readU32(data, off + i * 4));
    }
  }
  const fatArr = new Uint32Array(fat);

  const mfFirst = readU32(data, 60);
  const mfSectorCount = readU32(data, 64);
  const miniFatEntries: number[] = [];
  if (mfFirst !== FREE && mfFirst !== END_OF_CHAIN) {
    const mfData = readSectorChain(
      data,
      fatArr,
      sectorSize,
      mfFirst,
      mfSectorCount * sectorSize,
    );
    for (let i = 0; i < mfData.byteLength / 4; i++) {
      miniFatEntries.push(
        mfData[i * 4] | (mfData[i * 4 + 1] << 8) |
          (mfData[i * 4 + 2] << 16) | (mfData[i * 4 + 3] << 24),
      );
    }
  }
  const miniFatArr = new Uint32Array(miniFatEntries);

  const entries = new Map<string, DirEntry>();
  let rootEntry: DirEntry | null = null;

  let cur = firstDirSector;
  while (cur !== FREE && cur !== END_OF_CHAIN) {
    const dirOff = (cur + 1) * sectorSize;
    for (let i = 0; i < 4; i++) {
      const eo = dirOff + i * 128;
      const nameLen = readU16(data, eo + 64);
      const name = new TextDecoder("utf-16le").decode(
        data.subarray(eo, eo + nameLen - 2),
      );
      const type = data[eo + 66] as DirEntryType;
      const fs = readU32(data, eo + 116);
      const sl = readU32(data, eo + 120);

      if (type === DirEntryType.Root) {
        rootEntry = { name, type, firstSector: fs, streamLength: sl };
      } else if (type === DirEntryType.Stream) {
        entries.set(name, { name, type, firstSector: fs, streamLength: sl });
      }
    }
    cur = fatArr[cur];
  }

  if (!rootEntry) throw new Error("未找到根目录条目");

  return {
    data,
    sectorSize,
    miniSectorSize,
    fat: fatArr,
    miniFat: miniFatArr,
    rootEntry,
    entries,
  };
}

export function extractStream(doc: Ole2Doc, name: string): Uint8Array {
  const entry = doc.entries.get(name);
  if (!entry) throw new Error(`流 "${name}" 未找到`);

  if (entry.streamLength >= 4096) {
    return readSectorChain(
      doc.data,
      doc.fat,
      doc.sectorSize,
      entry.firstSector,
      entry.streamLength,
    );
  }

  const miniData = readSectorChain(
    doc.data,
    doc.fat,
    doc.sectorSize,
    doc.rootEntry.firstSector,
    doc.rootEntry.streamLength,
  );

  const result = new Uint8Array(entry.streamLength);
  let pos = 0;
  let cur = entry.firstSector;
  while (cur !== FREE && cur !== END_OF_CHAIN) {
    const srcOff = cur * doc.miniSectorSize;
    const toCopy = Math.min(doc.miniSectorSize, entry.streamLength - pos);
    result.set(miniData.subarray(srcOff, srcOff + toCopy), pos);
    pos += doc.miniSectorSize;
    cur = doc.miniFat[cur];
  }
  return result;
}

export function writeStream(
  doc: Ole2Doc,
  name: string,
  payload: Uint8Array,
): number {
  const entry = doc.entries.get(name);
  if (!entry) throw new Error(`流 "${name}" 未找到`);

  const oldLen = entry.streamLength;
  const useMini = oldLen < 4096;

  let writeData: Uint8Array;
  let writeLen: number;
  let needUpdateLen = false;

  if (payload.byteLength <= oldLen) {
    writeData = new Uint8Array(oldLen);
    writeData.set(payload);
    writeLen = oldLen;
  } else if (!useMini || payload.byteLength <= doc.rootEntry.streamLength) {
    writeData = payload;
    writeLen = payload.byteLength;
    needUpdateLen = true;
  } else {
    throw new Error(
      `数据(${payload.byteLength}B)超过迷你流容量(${doc.rootEntry.streamLength}B)`,
    );
  }

  if (!useMini) {
    const sectors = getSectorChain(doc.fat, entry.firstSector);
    for (let i = 0; i < sectors.length; i++) {
      const fo = (sectors[i] + 1) * doc.sectorSize;
      const srcOff = i * doc.sectorSize;
      const toCopy = Math.min(doc.sectorSize, writeData.byteLength - srcOff);
      if (toCopy > 0) {
        doc.data.set(writeData.subarray(srcOff, srcOff + toCopy), fo);
      } else {
        doc.data.fill(0, fo, fo + doc.sectorSize);
      }
    }
  } else {
    const sectors = getSectorChain(doc.fat, doc.rootEntry.firstSector);
    const miniData = new Uint8Array(doc.rootEntry.streamLength);
    for (let i = 0; i < sectors.length; i++) {
      const fo = (sectors[i] + 1) * doc.sectorSize;
      miniData.set(
        doc.data.subarray(fo, fo + doc.sectorSize),
        i * doc.sectorSize,
      );
    }

    let pos = 0;
    let cur = entry.firstSector;
    while (cur !== FREE && cur !== END_OF_CHAIN && pos < writeLen) {
      const off = cur * doc.miniSectorSize;
      const toCopy = Math.min(doc.miniSectorSize, writeData.byteLength - pos);
      if (toCopy > 0) {
        miniData.set(writeData.subarray(pos, pos + toCopy), off);
      }
      pos += doc.miniSectorSize;
      cur = doc.miniFat[cur];
    }

    for (let i = 0; i < sectors.length; i++) {
      const fo = (sectors[i] + 1) * doc.sectorSize;
      doc.data.set(
        miniData.subarray(i * doc.sectorSize, (i + 1) * doc.sectorSize),
        fo,
      );
    }
  }

  if (needUpdateLen) {
    const firstDir = readU32(doc.data, 48);
    let cur = firstDir;
    while (cur !== FREE && cur !== END_OF_CHAIN) {
      const dirOff = (cur + 1) * doc.sectorSize;
      for (let i = 0; i < 4; i++) {
        const eo = dirOff + i * 128;
        const nameLen = readU16(doc.data, eo + 64);
        const n = new TextDecoder("utf-16le").decode(
          doc.data.subarray(eo, eo + nameLen - 2),
        );
        if (n === name) {
          writeU32(doc.data, eo + 120, writeLen);
          return writeLen;
        }
      }
      cur = doc.fat[cur];
    }
  }

  return writeLen;
}
