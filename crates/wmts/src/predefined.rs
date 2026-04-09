use crate::matrix::{TileMatrixConfig, TileMatrixSet};
use crate::point::Point;

pub struct DefaultMatrixSet;

pub struct DefaultBBox;

impl DefaultBBox {
    pub fn mercator_wgs84_bbox() -> (Point, Point) {
        let lower_corner: Point = [-180.0, -85.051129].into();
        let upper_corner: Point = [180.0, 85.051129].into();
        (lower_corner, upper_corner)
    }
}

impl DefaultMatrixSet {
    // WebMercator (256px)
    // https://docs.ogc.org/is/17-083r2/17-083r2.html#73
    pub fn web_mercator_quad() -> TileMatrixSet {
        let config = TileMatrixConfig {
            base_scale: 559_082_264.0287178,
            top_left_corner: Point {
                x: -20037508.3427892,
                y: 20037508.3427892,
            },
            tile_size: 256,
            is_height_half: false,
            min_zoom: 0,
            max_zoom: 18,
        };
        TileMatrixSet::new(
            "Google Maps Compatible for the World".to_string(),
            "WebMercatorQuad".to_string(),
            "EPSG:3857".to_string(),
            "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible".to_string(),
            config,
        )
    }
    // WebMercator (512px)
    pub fn web_mercator_quad_hd() -> TileMatrixSet {
        let config = TileMatrixConfig {
            base_scale: 559_082_264.0287178 / 2.0,
            top_left_corner: Point {
                x: -20037508.3427892,
                y: 20037508.3427892,
            },
            tile_size: 512,
            is_height_half: false,
            min_zoom: 0,
            max_zoom: 18,
        };
        TileMatrixSet::new(
            "Google Maps Compatible for the World".to_string(),
            "WebMercatorQuadHD".to_string(),
            "EPSG:3857".to_string(),
            "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible".to_string(),
            config,
        )
    }

    // https://docs.ogc.org/is/17-083r2/17-083r2.html#76
    // 此处使用了 EPSG:4326 变体
    // EPSG:4324 按纬度，经度顺序写  90 -180
    // CRS84     按经度，纬度顺序写  -180 90
    pub fn world_crs84_quad() -> TileMatrixSet {
        let config = TileMatrixConfig {
            base_scale: 559_082_264.0287178 / 2.0,
            top_left_corner: Point { x: 90.0, y: -180.0 },
            tile_size: 256,
            is_height_half: true,
            min_zoom: 1,
            max_zoom: 18,
        };
        TileMatrixSet::new(
            "CRS84 for the World".to_string(),
            "WorldCRS84Quad".to_string(),
            "EPSG:4326".to_string(),
            "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad".to_string(),
            config,
        )
    }

    pub fn cgcs2000_quad() -> TileMatrixSet {
        let config = TileMatrixConfig {
            base_scale: 559_082_264.0287178 / 2.0,
            top_left_corner: Point { x: 90.0, y: -180.0 },
            tile_size: 256,
            is_height_half: true,
            min_zoom: 1,
            max_zoom: 18,
        };
        TileMatrixSet::new(
            "CRS84 for the World".to_string(),
            "CGCS2000Quad".to_string(),
            "EPSG:4490".to_string(),
            "http://www.opengis.net/def/wkss/OGC/1.0/GoogleCRS84Quad".to_string(),
            config,
        )
    }
    // EPSG:3395
    // See https://docs.ogc.org/is/17-083r4/17-083r4.html#toc51
    pub fn world_mercator_quad() -> TileMatrixSet {
        let config = TileMatrixConfig {
            base_scale: 559_082_264.0287178,
            top_left_corner: Point {
                x: -20037508.3427892,
                y: 20037508.3427892,
            },
            tile_size: 256,
            is_height_half: false,
            min_zoom: 0,
            max_zoom: 18,
        };
        TileMatrixSet::new(
            "CRS84 for the World".to_string(),
            "WorldMercatorWGS84Quad".to_string(),
            "EPSG:3395".to_string(),
            "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible".to_string(),
            config,
        )
    }
}

pub struct Predefined;

impl Predefined {
    pub fn web_mercator_quad() -> TileMatrixSet {
        DefaultMatrixSet::web_mercator_quad()
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_tilematrix() {
        let m = DefaultMatrixSet::web_mercator_quad_hd();
        assert_eq!(m.tile_matrices.len(), 19);
        assert_eq!(m.clone().set_zoom(1, 3).identifier, "WebMercatorQuadHDF1T3");
        assert_eq!(m.identifier, "WebMercatorQuadHD");
    }
}
