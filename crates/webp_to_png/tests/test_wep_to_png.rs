// tests/webp_conversion_tests.rs
use image::{ImageBuffer, Rgba};
use std::io::Cursor;
use webp_to_png::webp_to_png; // 假设你的crate名为image_converter

fn create_test_webp() -> Vec<u8> {
    let img = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_pixel(1, 1, Rgba([255u8, 0u8, 0u8, 255u8]));
    let mut webp_data = Vec::new();
    img.write_to(&mut Cursor::new(&mut webp_data), image::ImageFormat::WebP)
        .expect("Failed to create test WebP");
    webp_data
}

fn is_valid_png(data: &[u8]) -> bool {
    let png_header: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    data.starts_with(&png_header)
}

#[test]
fn test_valid_webp_conversion() {
    let webp_data = create_test_webp();
    let result = webp_to_png(webp_data);
    assert!(result.is_ok());

    let png_data = result.unwrap();
    assert!(!png_data.is_empty());
    assert!(is_valid_png(&png_data));

    // 验证是否能被image库加载
    let img = image::load_from_memory(&png_data);
    assert!(img.is_ok());
}

#[test]
fn test_invalid_webp() {
    let invalid_data = vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let result = webp_to_png(invalid_data);
    assert!(result.is_err());
}

#[test]
fn test_empty_input() {
    let empty_data = Vec::new();
    let result = webp_to_png(empty_data);
    assert!(result.is_err());
}
