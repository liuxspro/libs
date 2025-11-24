use file_format::FileFormat;
use google_earth::decrypt_data;
use std::fs;
use std::path::Path;

#[test]
fn test_file_decryption() {
    let input_file = "./tests/test_data/f1-021-i.1016";
    if Path::new(input_file).exists() {
        let encrypted_data = fs::read(input_file).unwrap();
        let data = decrypt_data(&encrypted_data, None).unwrap();
        // let output_file = "./tests/a.jpg";
        // fs::write(output_file, &data).unwrap();
        let fmt = FileFormat::from_bytes(&data);
        assert_eq!(fmt, FileFormat::JointPhotographicExpertsGroup)
    } else {
        eprintln!("跳过文件测试: {} 不存在", input_file);
    }
}
