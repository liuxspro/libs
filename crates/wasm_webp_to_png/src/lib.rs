mod utils;

use wasm_bindgen::prelude::*;

use webp_to_png::webp_to_png as webp_to_png_lib;

#[wasm_bindgen]
pub fn webp_to_png(webp_data: Vec<u8>) -> Result<Vec<u8>, JsValue> {
    utils::set_panic_hook(); // 设置更好的错误信息
    webp_to_png_lib(webp_data).map_err(|e| JsValue::from_str(&e.to_string()))
}
