# Convert a webp image to png

[![JSR](https://jsr.io/badges/@liuxspro/webp-to-png)](https://jsr.io/badges/@liuxspro/webp-to-png)

using [image](https://github.com/image-rs/image) to convert webp image  
using [wasm-pack](https://rustwasm.github.io/wasm-pack/) compiled to wasm  
using [@libs/bundle](https://jsr.io/@libs/bundle) to bundle wasm  

## Usage

```ts
import { webp_to_png } from "jsr:@liuxspro/webp-to-png";
const webp_data = new Uint8Array([...])
console.log(await webp_to_png(webp_data))
```

## Build

Build and bundle wasm

```bash
deno task build
```

