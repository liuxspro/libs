use crate::layer::Layer;
use crate::matrix::TileMatrixSet;
use minijinja::Environment;
use serde::Serialize;

#[derive(Serialize)]
pub struct Service {
    pub title: String,
    pub abstract_: String,
}

pub struct Capabilities {
    pub service: Service,
    pub layers: Vec<Layer>,
    pub tile_matrix_set: TileMatrixSet,
}

impl Capabilities {
    pub fn to_xml(&self) -> String {
        let mut env = Environment::new();
        env.set_trim_blocks(true); // 自动删除块后的换行符
        env.set_lstrip_blocks(true); // 自动删除块前的空格

        env.add_template("wmts", include_str!("templates/wmts.jinja"))
            .unwrap();
        let template = env.get_template("wmts").unwrap();
        template
            .render(minijinja::context! {
                service => &self.service,
                layers => &self.layers
            })
            .unwrap()
    }
}
