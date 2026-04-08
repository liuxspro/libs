use super::matrix::TileMatrixSet;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct Layer {
    pub title: String,
    pub abstract_: String,
    pub id: String,
    pub url: String,
    pub tile_matrix_set: TileMatrixSet,
}

/// 转换URL模板中的占位符
/// 将{z}替换为{TileMatrix}，{x}替换为{TileCol}，{y}替换为{TileRow},
/// 同时将&替换为 `&amp;` ，`|`替换为`%7c`，以符合 XML 规范
pub fn trans_url(url: String) -> String {
    url.replace("{z}", "{TileMatrix}")
        .replace("{x}", "{TileCol}")
        .replace("{y}", "{TileRow}")
        .replace("&", "&amp;")
        .replace("|", "%7c")
}

impl Layer {
    /// 获取转换后的URL
    pub fn transformed_url(&self) -> String {
        trans_url(self.url.clone())
    }

    /// 创建新的Layer，自动转换URL
    pub fn new(
        title: impl Into<String>,
        abstract_: impl Into<String>,
        id: impl Into<String>,
        url: impl Into<String>,
        tile_matrix_set: TileMatrixSet,
    ) -> Self {
        Self {
            title: title.into(),
            abstract_: abstract_.into(),
            id: id.into(),
            url: url.into(), // 存储原始URL
            tile_matrix_set,
        }
    }

    /// 更新URL
    pub fn set_url(&mut self, url: impl Into<String>) {
        self.url = url.into();
    }
}

#[cfg(test)]
mod tests {
    use crate::matrix::DefaultMatrixSet;

    use super::*;
    #[test]
    fn test_trans_url() {
        let url = "http://example.com/tiles/{z}/{x}/{y}.png?a=1&b=2&c=3".to_string();
        let trans_url = trans_url(url);
        assert_eq!(
            trans_url,
            "http://example.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?a=1&amp;b=2&amp;c=3"
                .to_string()
        );
    }

    #[test]
    fn test_layer() {
        let url_1 = "http://a.com/tiles/{z}/{x}/{y}.png?a=1&b=2&c=3";
        let url_2 = "http://b.com/tiles/{z}/{x}/{y}.png?d=4&e=5&f=6";
        let mut layer = Layer {
            title: "Test Layer".to_string(),
            abstract_: "This is a test layer".to_string(),
            id: "test_layer".to_string(),
            url: url_1.to_string().clone(),
            tile_matrix_set: DefaultMatrixSet::web_mercator_quad(),
        };
        let layer2 = Layer::new(
            "Test Layer",
            "This is a test layer",
            "test_layer",
            url_1.to_string().clone(),
            DefaultMatrixSet::web_mercator_quad(),
        );
        assert_eq!(
            layer.transformed_url(),
            "http://a.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?a=1&amp;b=2&amp;c=3"
                .to_string()
        );
        assert_eq!(
            layer2.transformed_url(),
            "http://a.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?a=1&amp;b=2&amp;c=3"
                .to_string()
        );
        layer.set_url(url_2);
        assert_eq!(
            layer.transformed_url(),
            "http://b.com/tiles/{TileMatrix}/{TileCol}/{TileRow}.png?d=4&amp;e=5&amp;f=6"
                .to_string()
        );
    }
}
