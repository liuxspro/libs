use crate::layer::Layers;
use minijinja::Environment;
use serde::Serialize;

#[derive(Serialize)]
pub struct Service {
    pub title: String,
    pub abstract_: String,
}

pub struct Capabilities {
    pub service: Service,
    pub layers: Layers,
}

impl Capabilities {
    pub fn to_xml(&self) -> String {
        let mut env = Environment::new();
        let temp_content = include_str!("templates/wmts.jinja");
        env.set_trim_blocks(true); // 自动删除块后的换行符
        env.set_lstrip_blocks(true); // 自动删除块前的空格

        env.add_template("wmts", temp_content).unwrap();
        let template = env.get_template("wmts").unwrap();
        template
            .render(minijinja::context! {
                service => &self.service,
                layers => &self.layers.layers,
                tile_matrix_sets => &self.layers.unique_tile_matrix_sets()
            })
            .unwrap()
    }
}

#[cfg(test)]
mod test {
    use crate::cap::{Capabilities, Service};
    use crate::layer::{Layer, Layers};
    use crate::predefined::{DefaultBBox, DefaultMatrixSet};

    #[test]
    fn test_cap() {
        let url_1 = "http://a.com/tiles/{z}/{x}/{y}.png?a=1&b=2&c=3";
        let url_2 = "http://b.com/tiles/{z}/{x}/{y}.png?d=4&e=5&f=6";
        let layer1 = Layer {
            title: "Test Layer".to_string(),
            abstract_: "This is a test layer".to_string(),
            identifier: "test_layer".to_string(),
            style: "default".to_string(),
            format: "image/png".to_string(),
            bbox: DefaultBBox::mercator_wgs84_bbox(),
            url: url_1.to_string().clone(),
            tile_matrix_set: DefaultMatrixSet::web_mercator_quad(),
            transformed_url: None,
        };
        let layer2 = Layer::new(
            "Test Layer",
            "This is a test layer",
            "test_layer",
            DefaultBBox::mercator_wgs84_bbox(),
            "default",
            "image/png",
            url_2.to_string().clone(),
            DefaultMatrixSet::web_mercator_quad(),
        );
        // let layers = Layers::new(vec![layer1, layer2]);
        let layers = Layers {
            layers: vec![layer1, layer2],
        };
        let xml = Capabilities {
            service: Service {
                title: "Test Service".to_string(),
                abstract_: "This is a test service".to_string(),
            },
            layers: layers,
        };
        println!("{}", xml.to_xml());
    }
}
