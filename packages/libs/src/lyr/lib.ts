/**
 * 修补 .lyr 文件
 *
 * 用法:
 * ```typescript
 * import { patchLyr } from "./lib.ts";
 *
 * const input = Deno.readFileSync("base.lyr");
 * const output = patchLyr(input, {
 *   oldUrl: "https://mt.google.com/vt/lyrs=s&x={col}&y={row}&z={level}",
 *   newUrl: "https://mt1.google.com/vt/lyrs=s&x={col}&y={row}&z={level}",
 *   oldName: "Google Maps Satellite",
 *   newName: "My Layer",
 *   description: "自定义描述",
 * });
 * Deno.writeFileSync("output.lyr", output);
 * ```
 *
 * @module
 */

import { extractStream, parseOle2, writeStream } from "./ole2.ts";
import { patchLayerStream } from "./patcher.ts";
import type { StringReplace } from "./patcher.ts";

/** 修补选项 */
export interface PatchOptions {
  /** 旧瓦片 URL（必填） */
  oldUrl: string;
  /** 新瓦片 URL（必填） */
  newUrl: string;

  /** 旧图层名称（可选，不提供则不修改名称） */
  oldName?: string;
  /** 新图层名称 */
  newName?: string;

  /**
   * 新图层描述（可选）
   *
   * 提供此值时，描述字段会被完全替换为此文本。
   * 不提供时，描述中的 URL 部分会被替换为新 URL，
   * 前缀（如 "此图层包含以下来源的数据 "）保持不变。
   */
  description?: string;
}

/** 修补结果 */
export interface PatchResult {
  /** 已执行的修改描述 */
  changes: string[];
  /** 修补后的 .lyr 文件数据 */
  data: Uint8Array;
  /** 文件大小 */
  fileSize: number;
}

/** 描述中 URL 前面的中文前缀 */
const DESC_PREFIX = "此图层包含以下来源的数据 ";

/**
 * 修补 .lyr 文件。
 *
 * 纯函数，不读写磁盘。
 *
 * @param lyrData  原始的 .lyr 文件二进制数据
 * @param options  修补选项
 * @returns 修补后的文件数据和修改记录
 */
export function patchLyr(
  lyrData: Uint8Array,
  options: PatchOptions,
): PatchResult {
  const { oldUrl, newUrl, oldName, newName, description } = options;

  // ── 解析 OLE2 ──
  const doc = parseOle2(lyrData);

  if (!doc.entries.has("Layer")) {
    throw new Error("文件中没有 Layer 流");
  }

  // ── 提取 Layer 流 ──
  const layerData = extractStream(doc, "Layer");

  // ── 构建替换列表 ──
  const replaces: StringReplace[] = [];

  if (oldUrl !== newUrl) {
    if (description !== undefined) {
      replaces.push({
        oldValue: DESC_PREFIX + oldUrl,
        newValue: description,
        label: `描述: → ${description}`,
      });
    } else {
      replaces.push({
        oldValue: DESC_PREFIX + oldUrl,
        newValue: DESC_PREFIX + newUrl,
        label: `描述URL: → ${newUrl}`,
      });
    }
    replaces.push({
      oldValue: oldUrl,
      newValue: newUrl,
      label: `瓦片URL: → ${newUrl}`,
    });
  } else if (description !== undefined) {
    replaces.push({
      oldValue: DESC_PREFIX + oldUrl,
      newValue: description,
      label: `描述: → ${description}`,
    });
  }

  if (oldName !== undefined && newName !== undefined && oldName !== newName) {
    replaces.push({
      oldValue: oldName,
      newValue: newName,
      label: `图层名称: ${oldName} → ${newName}`,
    });
  }

  if (replaces.length === 0) {
    return {
      changes: [],
      data: new Uint8Array(lyrData),
      fileSize: lyrData.byteLength,
    };
  }

  // ── 执行修补 ──
  const { changes, modified } = patchLayerStream(layerData, replaces);

  if (changes.length === 0) {
    return {
      changes: [],
      data: new Uint8Array(lyrData),
      fileSize: lyrData.byteLength,
    };
  }

  // ── 写回 OLE2 ──
  writeStream(doc, "Layer", modified);

  return {
    changes,
    data: doc.data,
    fileSize: doc.data.byteLength,
  };
}
