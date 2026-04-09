use crate::point::Point;
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
