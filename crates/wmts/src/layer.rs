use crate::matrix::TileMatrixSet;
use crate::point::Point;
use serde::Serialize;

use std::collections::HashSet;

#[derive(Serialize, Debug)]
pub struct Layer {
    pub title: String,
    pub abstract_: String,
    pub identifier: String,
    pub bbox: (Point, Point),
    pub style: String,
    pub format: String,
    pub url: String,
    pub tile_matrix_set: TileMatrixSet,
    pub transformed_url: Option<String>,
}

/// 转换URL模板中的占位符
/// 将{z}替换为{TileMatrix}，{x}替换为{TileCol}，{y}替换为{TileRow},
/// 同时将&替换为 `&amp;` ，`|`替换为`%7c`，以符合 XML 规范
///
/// Example:
/// ```
/// let url = "http://example.com/tiles/{z}/{x}/{y}.png?a=1&b=2&c=3".to_string();
/// let trans_url = wmts::layer::trans_url(url);
/// assert_eq!( trans_url, "http://example.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?a=1&amp;b=2&amp;c=3".to_string() );
/// ```
pub fn trans_url(url: String) -> String {
    url.replace("{z}", "{TileMatrix}")
        .replace("{x}", "{TileCol}")
        .replace("{y}", "{TileRow}")
        .replace("&", "&amp;")
        .replace("|", "%7c")
}

impl Layer {
    /// 创建新的Layer，自动转换URL
    pub fn new(
        title: impl Into<String>,
        abstract_: impl Into<String>,
        identifier: impl Into<String>,
        bbox: (Point, Point),
        style: impl Into<String>,
        format: impl Into<String>,
        url: String,
        tile_matrix_set: TileMatrixSet,
    ) -> Self {
        let transformed_url = trans_url(url.clone().into());
        Self {
            title: title.into(),
            abstract_: abstract_.into(),
            identifier: identifier.into(),
            bbox,
            style: style.into(),
            format: format.into(),
            url: url.clone(), // 存储原始URL
            tile_matrix_set,
            transformed_url: Some(transformed_url), // 存储转换后的URL
        }
    }

    /// 更新URL
    pub fn set_url(&mut self, url: impl Into<String>) {
        self.url = url.into();
    }
}

#[derive(Serialize)]
pub struct Layers {
    pub layers: Vec<Layer>,
}

impl Layers {
    pub fn new(layers: Vec<Layer>) -> Self {
        Self { layers }
    }

    pub fn add_layer(&mut self, layer: Layer) {
        self.layers.push(layer);
    }

    pub fn get_layer(&self, id: &str) -> Option<&Layer> {
        self.layers.iter().find(|layer| layer.identifier == id)
    }

    pub fn unique_tile_matrix_sets(&self) -> Vec<TileMatrixSet> {
        let mut seen = HashSet::new();
        let mut result = Vec::new();

        for layer in &self.layers {
            let identifier = &layer.tile_matrix_set.identifier;
            if !seen.contains(identifier) {
                seen.insert(identifier.clone());
                result.push(layer.tile_matrix_set.clone());
            }
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use crate::predefined::DefaultMatrixSet;

    use super::*;

    #[test]
    fn test_layer() {
        let layer = Layer::new(
            "Test Layer",
            "This is a test layer",
            "test_layer",
            (Point::new(-180.0, -85.051129), Point::new(180.0, 85.051129)),
            "default",
            "image/png",
            "http://a.com/tiles/{z}/{x}/{y}.png?a=1&b=2&c=3".to_string(),
            DefaultMatrixSet::web_mercator_quad(),
        );
        assert_eq!(
            layer.transformed_url,
            Some(
                "http://a.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?a=1&amp;b=2&amp;c=3"
                    .to_string()
            )
        );
    }
}
