import init, { webp_to_png as wasm_webp_to_png } from "./wasm_webp_to_png.js";

/**
 * Convert a webp image to png.
 *
 * @param data Webp data Uint8Array
 * @returns PNG data as Promised Uint8Array
 *
 * ## Example
 *
 * ```ts
 * import { webp_to_png } from "jsr:@liuxspro/webp-to-png";
 *
 * const webp_data = new Uint8Array([...])
 * console.log(await webp_to_png(webp_data))
 * ```
 */
export async function webp_to_png(data: Uint8Array): Promise<Uint8Array> {
  await init();
  return wasm_webp_to_png(data);
}
