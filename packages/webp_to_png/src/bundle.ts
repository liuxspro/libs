/**
 * using [@libs/bundle](https://jsr.io/@libs/bundle/doc/wasm) to bundle wasm
 */
import { bundle } from "jsr:@libs/bundle/wasm";
import { dirname, join } from "jsr:@std/path";

const js_file_name = "wasm_webp_to_png.js";
const root_path = dirname(dirname(Deno.cwd()));
const project_path = join(root_path, "crates/wasm_webp_to_png");
const src_path = join(Deno.cwd(), "src");

await bundle(project_path);

// move to src
await Deno.rename(
  join(project_path, js_file_name),
  join(src_path, js_file_name),
);
