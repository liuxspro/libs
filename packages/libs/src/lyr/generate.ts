/**
 * 用法:
 * ```typescript
 * const testUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
 * const testName = "OpenStreetMap Standard";
 * const lyr_data = generate_internet_tiled_lyr(testName, testUrl);
 * Deno.writeFileSync("osm.lyr", lyr_data);
 * ```
 */

import { base_lyr_data } from "./base_lyr.ts";
import type { PatchOptions } from "./lib.ts";
import { patchLyr } from "./lib.ts";

export function generate_internet_tiled_lyr(
  name: string,
  url: string,
  description: string | undefined = undefined,
): Uint8Array {
  if (!description) {
    description = `此图层包含以下来源的数据 ${url}`;
  }
  url = url.replace(/\{x\}/g, "{col}")
    .replace(/\{y\}/g, "{row}")
    .replace(/\{z\}/g, "{level}");
  const options: PatchOptions = {
    oldUrl: "https://mt.google.com/vt/lyrs=s&x={col}&y={row}&z={level}",
    newUrl: url,
    oldName: "Google Maps Satellite",
    newName: name,
    description: description,
  };
  return patchLyr(base_lyr_data, options).data;
}
