use super::matrix::TileMatrixSet;
use serde::Serialize;

#[derive(Serialize)]
pub struct Layer {
    pub title: String,
    pub abstract_: String,
    pub id: String,
    pub tile_matrix_set_link: String,
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

#[cfg(test)]
mod tests {
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
}
