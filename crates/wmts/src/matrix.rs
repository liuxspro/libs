use super::point::Point;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct TileMatrix {
    pub identifier: String,
    pub scale_denominator: f64,
    pub top_left_corner: Point,
    pub tile_width: u32,
    pub tile_height: u32,
    pub matrix_width: u32,
    pub matrix_height: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct TileMatrixSet {
    pub title: String,
    pub identifier: String,
    pub supported_crs: String,
    pub wellknown_scale_set: String,
    pub tile_matrices: Vec<TileMatrix>,
    pub min_zoom: u8,
    pub max_zoom: u8,
    pub config: TileMatrixConfig,
}

#[derive(Debug, Clone, Serialize)]
pub struct TileMatrixConfig {
    pub base_scale: f64,
    pub top_left_corner: Point,
    pub tile_size: u32,
    pub is_height_half: bool,
    pub min_zoom: u8,
    pub max_zoom: u8,
}

pub fn generate_tile_matrices(config: TileMatrixConfig) -> Vec<TileMatrix> {
    (config.min_zoom..=config.max_zoom)
        .map(|zoom| {
            let scale_denominator = config.base_scale / 2f64.powi(zoom as i32);
            let matrix_width = 2u32.pow(zoom as u32);
            let mut matrix_height: u32 = 2u32.pow(zoom as u32);
            if config.is_height_half {
                matrix_height = 2u32.pow(zoom as u32 - 1);
            }
            TileMatrix {
                identifier: format!("{}", zoom),
                scale_denominator,
                top_left_corner: config.top_left_corner.clone(),
                tile_width: config.tile_size,
                tile_height: config.tile_size,
                matrix_width,
                matrix_height,
            }
        })
        .collect()
}

impl TileMatrixSet {
    pub fn new(
        title: String,
        identifier: String,
        supported_crs: String,
        wellknown_scale_set: String,
        config: TileMatrixConfig,
    ) -> Self {
        let tile_matrices = generate_tile_matrices(config.clone());
        Self {
            title,
            identifier,
            supported_crs,
            wellknown_scale_set,
            min_zoom: config.min_zoom,
            max_zoom: config.max_zoom,
            tile_matrices,
            config,
        }
    }

    pub fn set_zoom(&mut self, min_zoom: u8, max_zoom: u8) -> Self {
        self.min_zoom = min_zoom;
        self.max_zoom = max_zoom;
        self.config.min_zoom = min_zoom;
        self.config.max_zoom = max_zoom;
        if min_zoom != 0 || max_zoom != 18 {
            self.identifier = format!("{}F{}T{}", self.identifier, min_zoom, max_zoom);
        }
        // 重新生成 tile_matrixs
        self.tile_matrices = generate_tile_matrices(self.config.clone());
        self.clone()
    }
}

pub struct DefaultMatrixSet;

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
